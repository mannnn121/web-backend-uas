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

#### macOS / Linux (without PowerShell)

If PowerShell is not installed, run the same import from a bash/zsh shell in the project root:

```bash
set -a && . ./.env && set +a
for t in users menus orders order_items; do
  docker compose exec -T -e MYSQL_PWD="$MARIADB_ROOT_PASSWORD" database mariadb -u root pos_db < migration/pos_db.$t-schema.sql
done
for t in users menus orders order_items; do
  docker compose exec -T -e MYSQL_PWD="$MARIADB_ROOT_PASSWORD" database mariadb -u root pos_db < migration/pos_db.$t.0000000010000.sql
done
```

Only run this against an empty `pos_db` (a fresh volume). Then verify the record counts as described in step 5.

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

---

## Running the Full Stack Locally

After the database is set up and the dataset is imported (steps 1–5 above), you can run the whole app (database, backend, frontend, and Nginx proxy) with Docker Compose.

### 1. Configure the Remaining Environment Variables

Make sure `.env` also has a `JWT_SECRET` set. You can generate random values with:

```bash
openssl rand -hex 16   # for MARIADB_ROOT_PASSWORD
openssl rand -hex 32   # for JWT_SECRET
```

If you change `MARIADB_ROOT_PASSWORD`, update the password inside `DATABASE_URL` too.

### 2. Build the Images

Build the backend and frontend images from your current branch, so you test your local code instead of the published `ghcr.io` images:

```bash
docker compose build
```

### 3. Mark the Initial Migration as Applied (one time only)

The backend container runs `prisma migrate deploy` every time it starts. Because the imported dataset already created the tables, Prisma would fail with error `P3005` ("database schema is not empty") and the backend would keep restarting. Tell Prisma the initial migration is already applied:

```bash
docker compose run --rm --no-deps backend npx prisma migrate resolve --applied 0_init
```

You only need to do this once per database volume. Skip it if you are starting from an empty database without importing the dataset; Prisma will create the tables itself in that case.

### 4. Start Everything

```bash
docker compose up -d
docker compose ps
```

All services should report `Up (healthy)` after a few seconds.

### 5. Open the App

| What | URL |
| --- | --- |
| App (sign-in page) | [http://localhost](http://localhost) |
| API docs (Swagger) | [http://localhost/api-docs/](http://localhost/api-docs/) |
| Backend health check | [http://localhost/api/backend/health](http://localhost/api/backend/health) |
| phpMyAdmin (optional) | [http://localhost:8080](http://localhost:8080) |

Default accounts from the shared dataset:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@pos.test` | `admin123` |
| Cashier | `cashier@pos.test` | `cashier123` |

If port 80 is already in use on your machine, set `HTTP_PORT` in `.env` (for example `HTTP_PORT=8000`) and open `http://localhost:8000` instead.

### Everyday Commands

```bash
docker compose up -d              # start (data is kept between restarts)
docker compose down               # stop
docker compose up -d --build      # rebuild after code changes
docker compose logs -f backend    # follow backend logs
```

### Optional: Hot Reload Development

To develop with hot reload, keep only the database in Docker and run the apps with Node.js on your machine:

```bash
docker compose up -d database

cp backend/.env.example backend/.env
cd backend && npm install && npm run dev    # http://localhost:3000
```

In a second terminal:

```bash
cd frontend && npm install && npm run dev   # http://localhost:3001
```

In `backend/.env`, set `DATABASE_URL` to use `localhost` as the host (for example `mysql://root:<your_password>@localhost:3306/pos_db`) and set a `JWT_SECRET`. The frontend dev server forwards `/api/backend/*` requests to `http://localhost:3000`.
