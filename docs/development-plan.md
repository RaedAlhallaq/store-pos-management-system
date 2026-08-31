# Store POS & Management System — Feature Roadmap & Development Plan

This document outlines the sequential phases for completing the full business features of the Store POS and Management System.

---

## 🗺️ Implementation Roadmap

```
Phase 1: Environment Audit & Initial Scaffolding (COMPLETED)
     ↓
Phase 2: Database Architecture, Migrations & Eloquent Models
     ↓
Phase 3: Products, Categories, Units & Inventory Movement Engine
     ↓
Phase 4: POS Terminal, Barcode Scanning, Cart & Invoicing Engine
     ↓
Phase 5: Customer & Supplier Debt Management (Ledgers & Payments)
     ↓
Phase 6: Operating Expenses & Daily Cash Drawer Closing (Sessions)
     ↓
Phase 7: Financial Reporting, Profit Analysis & Z-Report
     ↓
Phase 8: Database Backup, Export/Restore Engine & Store Settings
```

---

## Phase 2: Database Migrations & Eloquent Models
- Create migration files for:
  - `product_categories`, `product_units`, `products`
  - `stock_movements`
  - `customers`, `customer_transactions`, `customer_payments`
  - `suppliers`, `supplier_transactions`, `supplier_payments`
  - `sales`, `sale_items`, `sale_payments`
  - `purchases`, `purchase_items`, `purchase_payments`
  - `expense_categories`, `expenses`
  - `cash_sessions`, `cash_movements`
  - `settings`
- Build Eloquent models with fillable rules, relationships, accessors, and query scopes.
- Build Database Seeders with sample retail categories, units, and demonstration products.

---

## Phase 3: Products & Inventory Module
- **Backend:**
  - `ProductService` for managing stock adjustments, barcode indexing, and reorder alerts.
  - Form Requests with unique barcode validation and price rules (`selling_price >= cost_price`).
  - CRUD API endpoints with pagination and filter criteria.
- **Frontend:**
  - Products data table with search, category filtering, and barcode badge display.
  - Modal form for creating and editing products.
  - Low-stock notification indicators.

---

## Phase 4: POS & Cashier Engine
- **Backend:**
  - `SaleService` wrapped in DB Transactions.
  - Atomic sale completion: Create Sale -> Create Sale Items -> Decrement Inventory -> Create Stock Movements -> Create Payment -> Update Customer Balance (if debt).
- **Frontend:**
  - Rapid cashier interface optimized for keyboard shortcuts and barcode scanners.
  - Interactive shopping cart with quantity adjustments, discounts, and tax computation.
  - Multi-payment dialog (Cash, Mada/Card, Credit/Debt).
  - Thermal receipt printing generator (HTML / ESC-POS preview).

---

## Phase 5: Debt & Ledger Engine
- **Backend:**
  - `CustomerDebtService` and `SupplierDebtService`.
  - Transaction ledger tracking invoice debts and payments.
- **Frontend:**
  - Customer profile with debt balance and statement of account.
  - Payment receipt voucher dialog for settling debts.

---

## Phase 6: Daily Cash Closing & Expenses
- **Backend:**
  - `CashSessionService` tracking opening float, sales cash intake, expense cash payouts, and closing balance.
  - Calculation of cash discrepancy (surplus / deficit).
- **Frontend:**
  - Cashier opening/closing shift wizard.
  - Expenses logging interface with category tagging.

---

## Phase 7: Financial Reporting & Analytics
- Net Profit computation: Total Sales - Cost of Goods Sold (COGS) - Operational Expenses.
- Daily/Monthly sales revenue charts.
- Export to Excel and print-ready PDF reports.

---

## Phase 8: Backup & Restore Engine
- Safe `mysqldump` database export directly from the Settings screen.
- Verified restore mechanism with safety confirmation dialog.
