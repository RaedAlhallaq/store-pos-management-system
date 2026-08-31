# Store POS & Management System — Setup & Running Guide

## 1. Prerequisites

Ensure your system meets the following requirements:
- **Node.js:** v18.0+ (Tested on v26.5.0)
- **npm:** v9.0+ (Tested on v11.17.0)
- **PHP:** 8.2+ with PDO MySQL & OpenSSL (Tested on PHP 8.4.23)
- **Composer:** 2.0+ (Tested on Composer 2.10.2)
- **MySQL / MariaDB:** 10.4+ (Tested on MariaDB 10.4.28)

---

## 2. Installation Steps

### Step 1: Clone or Navigate to Directory
```bash
cd store-pos
```

### Step 2: Database Setup
Make sure MySQL / MariaDB daemon is running on port 3306.
Create the database:
```sql
CREATE DATABASE IF NOT EXISTS store_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Backend Setup
```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
```

### Step 4: Frontend Setup
```bash
cd ../frontend
npm install
copy .env.example .env
```

---

## 3. Running the Application

### 1. Start MySQL (if not running as a Windows service):
```powershell
& "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini"
```

### 2. Start Backend API Server:
```powershell
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```
API will be accessible at: `http://127.0.0.1:8000/api`

### 3. Start Frontend Development Server:
```powershell
cd frontend
npm run dev
```
Frontend will be accessible at: `http://localhost:5173` or `http://127.0.0.1:5173`

---

## 4. Default Credentials

- **URL:** `http://127.0.0.1:5173/login`
- **Email:** `owner@storepos.local`
- **Password:** `password123`
- **Role:** Store Owner (Admin)
