# Store POS & Management System — System Architecture Document

## 1. System Overview

The **Local POS & Store Management System** is an offline-first, high-performance retail and inventory management application designed for a single physical store. It combines a reactive modern single-page application (SPA) frontend with a robust, authoritative Laravel REST API backend backed by MySQL.

```
┌────────────────────────────────────────────────────────┐
│                   React 19 / Vite SPA                  │
│    (TypeScript + Tailwind CSS + TanStack Query)        │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON (Axios)
                            │ Bearer Token (Laravel Sanctum)
┌───────────────────────────▼────────────────────────────┐
│                    Laravel 11 REST API                 │
│   (Controllers → FormRequests → Services → Resources)  │
└───────────────────────────┬────────────────────────────┘
                            │ Eloquent ORM / Transactions
┌───────────────────────────▼────────────────────────────┐
│                    MySQL Database                      │
│                (Database: store_pos)                   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Architectural Pillars

### 2.1. Offline-First & Local Operation
- **Zero Cloud Reliance:** The application runs completely on local host resources (`127.0.0.1`). No cloud databases, external CDNs, or external APIs are required for store operation.
- **Local Network Ready:** The POS terminal, barcode scanners, and thermal receipt printers communicate across the local store network without requiring internet connectivity.

### 2.2. Authoritative Financial & Inventory Calculations
- **Backend Calculation Authority:** The frontend never performs authoritative balance or inventory calculations. All totals, taxes, discounts, profit margins, and remaining debts are calculated and committed within transactional boundaries in the backend service layer.
- **Server-authoritative selling price:** Sale line prices always come from the locked `products.selling_price` row. Client-provided `items.*.unit_price` is accepted for compatibility and ignored.
- **Server-side availability:** Inactive products cannot be sold. Requested quantity is checked against `stock_quantity` after `lockForUpdate()`; insufficient stock rejects the entire sale with HTTP 422 and rolls back the transaction.
- **Precision Monetary Types:** All monetary calculations use `DECIMAL(12,2)` in MySQL to prevent floating-point rounding inaccuracies.
- **Audit Trails & Non-Destructive Mutations:** Financial transactions (Sales, Debts, Payments, Cash Closings) are never permanently deleted. Reversals and cancellations use void/cancel operations with detailed audit logs.

### 2.3. Service-Oriented Backend Layering
```
HTTP Request
     ↓
Route & Middleware (Sanctum Auth, CORS)
     ↓
Form Request (Validation & Sanitization)
     ↓
Controller (Request Routing & Response Formatting)
     ↓
Service Layer (Authoritative Business Logic & DB Transactions)
     ↓
Eloquent Model & Database (store_pos)
     ↓
API Resource (Clean JSON Serialization)
```

---

## 3. Frontend Architecture

### 3.1. Tech Stack
- **Framework:** React 19 with Vite
- **Language:** TypeScript (Strict typing for financial contracts and API entities)
- **Styling:** Tailwind CSS (v4) with custom tokens and dark mode theme
- **Routing:** React Router v7 (`createBrowserRouter` with protected route guards)
- **State Management & Cache:** TanStack Query v5 + React Context
- **Forms & Validation:** React Hook Form + Zod
- **Icons & Alerts:** Lucide React & Sonner

### 3.2. RTL & Arabic First Design
- Full native Arabic (`dir="rtl"`) layout as primary interface with dynamic direction toggle (`dir="ltr"`).
- Cairo & Inter font hierarchy for optimal legibility on POS screens.

### 3.3. Key Frontend Modules
- **`src/services/apiClient.ts`:** Centralized Axios instance with bearer token injection and 401 redirect handling.
- **`src/features/auth/`:** Authentication context, login page, and token storage.
- **`src/app/layouts/`:** Responsive shell containing Header with real-time backend health monitor, collapsible Sidebar, and view containers.
- **`src/components/ui/`:** Reusable UI component library (Buttons, Inputs, Cards, Badges, Modals, Spinners, Tables).

---

## 4. Backend Architecture

### 4.1. Tech Stack
- **Framework:** Laravel 11/12
- **PHP Version:** PHP 8.4+
- **Authentication:** Laravel Sanctum (Personal Access Tokens)
- **Database:** MySQL 10.4+ / MariaDB (`store_pos`)

### 4.2. Security & Session Handling
- Tokens generated on login via Sanctum `createToken('POS Terminal')`.
- API endpoints protected with `auth:sanctum` middleware.
- CORS restricted to local client origins (`http://localhost:5173`, `http://127.0.0.1:5173`).
- Passwords hashed using bcrypt (12 rounds).
