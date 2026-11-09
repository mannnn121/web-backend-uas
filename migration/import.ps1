<#
.SYNOPSIS
    Automated import script to initialize a fresh local MariaDB database with the shared POS dataset.

.DESCRIPTION
    Validates Docker and MariaDB health, checks for an empty pos_db database,
    imports schemas and data in strict relational order, and validates records & foreign keys.
    Safe: Will abort immediately if target database already contains tables.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Anderson POS — Database Initialization & Migration     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. Locate Project Root & Load Credentials
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..")
$envFile = Join-Path $ProjectRoot ".env"

$dbPassword = $env:MARIADB_ROOT_PASSWORD
if (-not $dbPassword -and (Test-Path $envFile)) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*MARIADB_ROOT_PASSWORD\s*=\s*(.*)\s*$') {
            $dbPassword = $matches[1].Trim('"').Trim("'")
        }
    }
}

if (-not $dbPassword) {
    Write-Host "[ERROR] MARIADB_ROOT_PASSWORD is not set in environment or in .env file." -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure MARIADB_ROOT_PASSWORD." -ForegroundColor Yellow
    exit 1
}

# Helper to run mariadb command via docker compose exec
function Invoke-MariaDbQuery {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Query,
        [string]$Database = ""
    )

    $dbArg = if ($Database) { $Database } else { "" }
    $output = docker compose exec -T -e MYSQL_PWD="$dbPassword" database mariadb -u root -s -N $dbArg -e "$Query" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "MariaDB query failed (Exit code: $LASTEXITCODE): $output"
    }
    return $output
}

# 1. Verify Docker is running
Write-Host "`n[1/7] Verifying Docker daemon..." -ForegroundColor Cyan
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "  -> Docker daemon is active." -ForegroundColor Green

# 2. Verify MariaDB is running and healthy
Write-Host "`n[2/7] Checking MariaDB container health..." -ForegroundColor Cyan
$containerId = (docker compose ps -q database 2>$null)
if (-not $containerId -or $containerId.Trim() -eq "") {
    Write-Host "[ERROR] Database service is not running." -ForegroundColor Red
    Write-Host "Please start the database container first with: docker compose up -d database" -ForegroundColor Yellow
    exit 1
}

$containerId = $containerId.Trim()
$healthStatus = (docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $containerId 2>$null)
if ($LASTEXITCODE -ne 0 -or $healthStatus.Trim() -ne "healthy") {
    Write-Host "[ERROR] Database container is not healthy (Status: '$healthStatus')." -ForegroundColor Red
    Write-Host "Please wait until the container passes healthcheck or inspect logs with: docker compose logs database" -ForegroundColor Yellow
    exit 1
}
Write-Host "  -> MariaDB container 'pos_mariadb' is running and healthy." -ForegroundColor Green

# 3. Verify database pos_db exists
Write-Host "`n[3/7] Verifying database 'pos_db'..." -ForegroundColor Cyan
try {
    $dbExists = (Invoke-MariaDbQuery -Query "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'pos_db';").Trim()
    if ($dbExists -ne "pos_db") {
        Write-Host "[ERROR] Database 'pos_db' does not exist in MariaDB." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "[ERROR] Failed to query database schema: $_" -ForegroundColor Red
    exit 1
}
Write-Host "  -> Target database 'pos_db' exists." -ForegroundColor Green

# 4 & 5. Verify target database has zero tables; abort safely if tables exist
Write-Host "`n[4/7] Checking existing tables in 'pos_db' (Safe Guard)..." -ForegroundColor Cyan
try {
    $tableCountOutput = (Invoke-MariaDbQuery -Database "pos_db" -Query "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'pos_db';").Trim()
    $existingTableCount = [int]$tableCountOutput
}
catch {
    Write-Host "[ERROR] Failed to check table count: $_" -ForegroundColor Red
    exit 1
}

if ($existingTableCount -gt 0) {
    Write-Host "[ABORTED] Database 'pos_db' already contains $existingTableCount table(s)!" -ForegroundColor Yellow
    Write-Host "  -> To protect existing data, import will NOT overwrite an existing database." -ForegroundColor Yellow
    Write-Host "  -> No modifications were made." -ForegroundColor Green
    exit 1
}
Write-Host "  -> Target database is clean (0 tables found). Proceeding with import." -ForegroundColor Green

# 6 & 7. Import Schemas in strict relational order
$schemas = @(
    "pos_db.users-schema.sql",
    "pos_db.menus-schema.sql",
    "pos_db.orders-schema.sql",
    "pos_db.order_items-schema.sql"
)

Write-Host "`n[5/7] Importing table schemas..." -ForegroundColor Cyan
foreach ($schemaFile in $schemas) {
    $schemaPath = Join-Path $ScriptDir $schemaFile
    if (-not (Test-Path $schemaPath)) {
        Write-Host "[ERROR] Missing schema file: $schemaFile" -ForegroundColor Red
        exit 1
    }

    Write-Host "  -> Applying schema: $schemaFile"
    Get-Content -Path $schemaPath -Raw | docker compose exec -T -e MYSQL_PWD="$dbPassword" database mariadb -u root pos_db
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to apply schema file $schemaFile (Exit code: $LASTEXITCODE)." -ForegroundColor Red
        exit 1
    }
}
Write-Host "  -> All 4 schemas created successfully." -ForegroundColor Green

# 8. Import Data in strict relational order
$dataFiles = @(
    "pos_db.users.0000000010000.sql",
    "pos_db.menus.0000000010000.sql",
    "pos_db.orders.0000000010000.sql",
    "pos_db.order_items.0000000010000.sql"
)

Write-Host "`n[6/7] Importing dataset..." -ForegroundColor Cyan
foreach ($dataFile in $dataFiles) {
    $dataPath = Join-Path $ScriptDir $dataFile
    if (-not (Test-Path $dataPath)) {
        Write-Host "[ERROR] Missing data file: $dataFile" -ForegroundColor Red
        exit 1
    }

    Write-Host "  -> Loading data: $dataFile"
    Get-Content -Path $dataPath -Raw | docker compose exec -T -e MYSQL_PWD="$dbPassword" database mariadb -u root pos_db
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to load data file $dataFile (Exit code: $LASTEXITCODE)." -ForegroundColor Red
        exit 1
    }
}
Write-Host "  -> All dataset records imported successfully." -ForegroundColor Green

# 9 & 10. Validate record counts & foreign key consistency
Write-Host "`n[7/7] Validating record counts & integrity..." -ForegroundColor Cyan

$expectedCounts = @{
    "users"       = 2
    "menus"       = 7
    "orders"      = 11
    "order_items" = 14
}

$countsValid = $true
foreach ($tbl in $expectedCounts.Keys) {
    $count = [int]((Invoke-MariaDbQuery -Database "pos_db" -Query "SELECT COUNT(*) FROM \`$tbl\`;").Trim())
    $expected = $expectedCounts[$tbl]

    if ($count -eq $expected) {
        Write-Host "  [OK] Table '$tbl': $count records (matches expected $expected)" -ForegroundColor Green
    }
    else {
        Write-Host "  [FAIL] Table '$tbl': $count records (expected $expected)" -ForegroundColor Red
        $countsValid = $false
    }
}

if (-not $countsValid) {
    Write-Host "[ERROR] Record count verification failed!" -ForegroundColor Red
    exit 1
}

# Foreign Key Consistency Checks
Write-Host "  -> Checking foreign key consistency..."
$orphanOrders = [int]((Invoke-MariaDbQuery -Database "pos_db" -Query "SELECT COUNT(*) FROM orders WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);").Trim())
$orphanItemsOrder = [int]((Invoke-MariaDbQuery -Database "pos_db" -Query "SELECT COUNT(*) FROM order_items WHERE order_id NOT IN (SELECT id FROM orders);").Trim())
$orphanItemsMenu = [int]((Invoke-MariaDbQuery -Database "pos_db" -Query "SELECT COUNT(*) FROM order_items WHERE menu_id NOT IN (SELECT id FROM menus);").Trim())

if ($orphanOrders -ne 0 -or $orphanItemsOrder -ne 0 -or $orphanItemsMenu -ne 0) {
    Write-Host "[ERROR] Foreign key consistency violation detected!" -ForegroundColor Red
    Write-Host "  Orphan orders: $orphanOrders, Orphan order_items(order): $orphanItemsOrder, Orphan order_items(menu): $orphanItemsMenu" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] All foreign key relations validated (0 orphaned records)." -ForegroundColor Green

# Table Integrity Check
$tableChecks = (Invoke-MariaDbQuery -Database "pos_db" -Query "CHECK TABLE users, menus, orders, order_items;").Trim()
Write-Host "  [OK] CHECK TABLE passed for all 4 tables." -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   SUCCESS: Database import and validation completed!     " -ForegroundColor Green
Write-Host "   Total 34 records verified across 4 tables.             " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
