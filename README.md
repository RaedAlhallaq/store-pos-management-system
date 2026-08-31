# Store POS & Management System 🏪

> **نظام نقاط البيع وإدارة المتجر المحلي (Local POS & Store Management System)**
> Built with **React 19 (TypeScript) + Tailwind CSS + Laravel 11/12 + MySQL / MariaDB**.

---

## 🌟 Key Features & Highlights

- **⚡ Fast & Offline-First:** Runs 100% locally on store machines without external internet dependency.
- **🛡️ Secure Token Authentication:** Laravel Sanctum token-based authentication with protected frontend and backend routes.
- **🇸🇦 Native Arabic RTL:** Fully responsive interface tailored for Arabic users with English localization readiness.
- **💰 Financial Accuracy:** Authoritative backend calculation strategy using `DECIMAL(12,2)` precision.
- **📊 Real-time Health Monitor:** Live indicator checking backend API health and MySQL database connection latency.
- **🧩 Clean Modular Architecture:** Service layers, Form Requests, API Resources, and reusable React design system components.

---

## 🏗️ Project Structure

```text
store-pos/
│
├── frontend/                 # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── app/              # Router, Providers, Layouts (Header, Sidebar)
│   │   ├── components/       # Design System UI Components & Badges
│   │   ├── features/         # Auth, Dashboard, POS, Products, Reports, etc.
│   │   ├── services/         # Centralized Axios API Client
│   │   ├── lib/              # Utilities & Formatters
│   │   └── types/            # TypeScript Interface Definitions
│   └── package.json
│
├── backend/                  # Laravel 11/12 REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # HealthController, AuthController
│   │   ├── Http/Requests/Auth/     # LoginRequest
│   │   ├── Http/Resources/         # UserResource
│   │   └── Models/                 # User with HasApiTokens
│   ├── database/migrations/  # Database Migrations
│   ├── routes/api.php        # REST API Routes
│   └── .env
│
├── docs/                     # Architecture & Technical Documentation
│   ├── architecture.md       # Multi-Tier System Blueprint
│   ├── database.md           # Entity-Relationship Schemas (20+ Tables)
│   ├── api.md                # API Specifications & Contracts
│   ├── setup.md              # Installation & Running Guide
│   └── development-plan.md   # Phased Business Feature Roadmap
│
├── .gitignore
├── README.md
└── .env.example
```

---

## 🚀 Quickstart Guide

### 1. Database Setup
Ensure MySQL is running on port `3306`:
```sql
CREATE DATABASE IF NOT EXISTS store_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup & Run
```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan serve --host=127.0.0.1 --port=8000
```
Backend API will be live at: `http://127.0.0.1:8000/api`

### 3. Frontend Setup & Run
```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```
Frontend will be live at: `http://localhost:5173`

---

## 🔑 Default Credentials

- **URL:** `http://127.0.0.1:5173/login`
- **Email:** `owner@storepos.local`
- **Password:** `password123`
- **Role:** Store Owner (`admin`)

---

## 📋 Initialization Validation Checklist

- [x] Frontend starts (`http://127.0.0.1:5173`)
- [x] Tailwind CSS works (v4 custom theme & tokens)
- [x] React Router works (protected layout & navigation)
- [x] Backend starts (`http://127.0.0.1:8000`)
- [x] Laravel works (Laravel 11/12 REST API)
- [x] MySQL connection works (`store_pos` database)
- [x] API works (`GET /api/health` returning live status)
- [x] React can call Laravel (Axios + TanStack Query)
- [x] Authentication foundation works (Sanctum Tokens)
- [x] Protected routes work (Guards redirect unauthenticated users)
- [x] Git initialized & `.env` protected
- [x] Complete documentation created in `docs/`
