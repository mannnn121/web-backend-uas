# Anderson POS — Restaurant Point of Sale System

Fullstack Point of Sale (POS) and restaurant management system developed with Express.js, Prisma ORM, MariaDB, and Next.js.

---

## Docker Database Setup

This section outlines how team members (Brogil, Egip, Winny) can initialize and run an independent local MariaDB database container using Docker and the shared migration dataset.

### Prerequisites

Ensure the following tools are installed and running on your machine:
- **Git** (version control)
- **Docker Desktop** (ensure Docker Engine is running)
- **PowerShell** (for Windows automated setup)

---

### 1. Clone Repository

Clone the project repository and navigate into the project root directory:

```powershell
git clone https://github.com/mannnn121/web-backend-uas.git
cd web-backend-uas
```

---

### 2. Configure Environment

Copy the template environment configuration file to create your local `.env`:

```powershell
Copy-Item .env.example .env
```

Open `.env` and set your preferred root password:

```env
MARIADB_ROOT_PASSWORD=your_local_secure_password
```

> **Note**: Each team member manages their own local `.env` file. Never commit `.env` to Git. It is automatically ignored by `.gitignore`.

---

### 3. Start Database Container

Start the MariaDB 11.4 database service in detached mode:

```powershell
docker compose up -d database
```

Wait a few seconds for the healthcheck to report `healthy`. You can check status with:

```powershell
docker compose ps
```

---

### 4. Import Initial Dataset

Run the automated import script from PowerShell. This script verifies container health, ensures the database is clean, applies schemas, imports the shared dataset in proper relational order, and validates all records:

```powershell
powershell -ExecutionPolicy Bypass -File .\migration\import.ps1
```

> **Safety Guard**: The script strictly validates that `pos_db` has zero tables before importing. It will safely abort if tables already exist, preventing accidental data overwrites.

---

### 5. Verify Database

After running the import script, you can verify your database setup using any of the following methods:

#### A. Container Health & Status
```powershell
docker compose ps
```
The `pos_mariadb` container should report `Up (healthy)`.

#### B. Verify Tables & Record Counts
Run a verification query directly inside the container:
```powershell
docker compose exec -T database mariadb -u root -p pos_db -e "SELECT 'users' AS tbl, COUNT(*) AS count FROM users UNION ALL SELECT 'menus', COUNT(*) FROM menus UNION ALL SELECT 'orders', COUNT(*) FROM orders UNION ALL SELECT 'order_items', COUNT(*) FROM order_items;"
```
Expected record counts:
- `users`: **2** records (Admin and Cashier accounts)
- `menus`: **7** records (Coffee and beverage menu items)
- `orders`: **11** records (Historical transactions)
- `order_items`: **14** records (Ordered items details)
- **Total**: **34** records

#### C. Visual Inspection via phpMyAdmin
A phpMyAdmin GUI service is included in `docker-compose.yml`:
1. Start phpMyAdmin (if not already running):
   ```powershell
   docker compose up -d phpmyadmin
   ```
2. Open your browser and navigate to: **[http://localhost:8080](http://localhost:8080)**
3. Log in with:
   - **Server**: `database`
   - **Username**: `root`
   - **Password**: *(The password you configured in your `.env`)*

---

### 6. Backend Connection Configuration

When connecting the Backend container (or other services running inside the Docker network) to MariaDB:

```text
Host: database
Port: 3306
Database: pos_db
```

Connection string format for `DATABASE_URL`:
```text
mysql://root:<your_password>@database:3306/pos_db
```

> **Important**: Do **not** use `localhost` or `127.0.0.1` as the database hostname when connecting from inside another Docker container (such as the backend service). Inside the Docker bridge network (`pos-network`), containers communicate using the service name `database`. Use `localhost:3306` only when connecting from tools running directly on your host machine (such as local Node.js or a desktop database client).

---

### Note on Data Persistence

Each team member has an independent local MariaDB instance and Docker Named Volume (`pos_mariadb_migration_data`). All data updates, orders, and menu modifications persist locally on your machine and will not affect other members' databases.
