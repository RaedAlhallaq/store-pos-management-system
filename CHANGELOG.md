# Changelog

## 2026-09-01 - PHASE 1F - Inventory Migration

- Task: migrate the Inventory feature from TypeScript and TanStack Query to JavaScript and local React/Axios state.
- Changes: replaced `InventoryPage.tsx` with `InventoryPage.jsx`; replaced the stock-movements, metrics, and product-select queries and the stock-adjustment mutation with local state, effects, and explicit refresh functions over the existing Axios `productsApi`; removed the page's type-only Products import.
- Preserved: ledger listing, movement-type filter with page reset, pagination, KPI cards, movement badges, quick stock adjustment through the Products `StockAdjustmentModal`, loading and empty states, Arabic/RTL text, styling, routes, and all API payloads and response handling.
- Behavior note: Products and Inventory no longer share a query cache, so an adjustment on one page is not pushed into the other; each refreshes its own data after its own adjustment and on mount.
- Verification: `npm install`, lint (13 warnings, no errors), and production build passed. Inventory has no TypeScript file and no TanStack Query import or usage. Remaining TypeScript: 43 files. Remaining TanStack Query: 4 feature areas.

## 2026-09-01 - PHASE 1E - Products Migration

- Task: migrate the Products feature from TypeScript and TanStack Query to JavaScript and local React/Axios state.
- Changes: replaced all eight Products `.ts`/`.tsx` files with `.js`/`.jsx` counterparts and deleted the Products type module; replaced the products/categories/units/metrics queries and the create, update, delete, and stock-adjustment mutations with local state, effects, and explicit refresh functions over the existing Axios client.
- Preserved: listing, search, category and stock-status filters, pagination, create/edit/delete, category and unit management, stock adjustment, Zod/React Hook Form validation, pricing and profit calculations, barcode generation/copy, loading/empty states, toasts, routes, Arabic/RTL text, styling, and all API payloads and response handling.
- Behavior note: adjusting stock from Products no longer invalidates Inventory's `stock-movements` cache, because Products no longer owns a query client.
- Verification: `npm install`, lint (11 warnings, no errors), and production build passed. Products has no TypeScript file and no TanStack Query import or usage. Remaining TypeScript: 44 files. Remaining TanStack Query: 5 feature areas.

## 2026-08-31 - PHASE 1D - Sales Migration

- Task: migrate the Sales feature from TypeScript and TanStack Query to JavaScript and local React/Axios state.
- Changes: replaced `SalesPage.tsx` with `SalesPage.jsx`; preserved sales listing, search, payment/invoice-status and date filters, pagination, receipt viewing/printing, void prompt, API payloads, and toast messages. The Sales list now uses a local effect and explicitly refreshes after a successful void.
- Cleanup: removed the no-longer-referenced temporary `posTypes.js` compatibility module.
- Verification: `npm.cmd install`, lint (9 warnings, no errors), and production build passed. Sales has no TypeScript file or TanStack Query use. Remaining TypeScript: 52 files. Remaining TanStack Query: 6 feature areas.

## 2026-08-31 - PHASE 1C - POS Migration

- Task: migrate the complete POS feature from TypeScript and TanStack Query to JavaScript and local React/Axios state.
- Changes: replaced all nine POS `.ts`/`.tsx` files with `.js`/`.jsx` counterparts; replaced product/category/customer queries and sale mutation with explicit local loaders and checkout state; preserved cart, held-order, payment, receipt, barcode, customer, API payload, and post-checkout refresh behavior.
- Compatibility: retained `posTypes.js` as the existing path for the untouched Sales feature's type-only import; no Sales source was changed.
- Verification: `npm.cmd install`, lint (8 warnings, no errors), and production build passed. POS has no TypeScript file or TanStack Query use. Remaining TypeScript: 53 files. Remaining TanStack Query: 7 feature-page imports.

## 2026-08-31 - PHASE 1B - Dashboard Migration

- Task: migrate the Dashboard page from TypeScript and TanStack Query to JavaScript and native React/Axios state.
- Changes: replaced `DashboardPage.tsx` with `DashboardPage.jsx`; preserved its six API calls, date filters, KPI calculations, styling, actions, and zero-value fallback behavior. Each request now updates local state independently, matching the former independent query behavior.
- Verification: `npm.cmd install`, lint (8 warnings, no errors), and production build passed. Dashboard has no TypeScript file or TanStack Query import. Remaining TypeScript: 62 files. Remaining TanStack Query: 8 feature-page imports.

## 2026-08-31 - PHASE 1A - Frontend Foundation Simplification

- Task: migrate shared frontend runtime infrastructure from TypeScript and TanStack Query to JavaScript and native React/Axios state.
- Changes: converted entry, Vite config, providers, router/guard, layout/header/sidebar, Axios/auth runtime, utility, and backend-status files to `.js`/`.jsx`; added `useBackendHealth`; removed the Query provider and shared Query hooks; removed TypeScript compiler/configuration and direct type packages.
- Reason: establish a simpler JavaScript/Axios foundation while preserving existing feature-page business logic.
- Verification: `npm.cmd install`, lint (8 warnings, no errors), and production build passed. Remaining TypeScript: 63 files. Remaining TanStack Query: 9 feature-page imports.

## 2026-08-31 - PHASE 0 - Repository Audit

- Task: establish persistent project memory and audit the existing repository.
- Changes: added `AI_RULES.md`, `PROJECT_STATUS.md`, `PROJECT_PLAN.md`, `AI_HANDOFF.md`, and `CHANGELOG.md`.
- Reason: enable safe continuation by future AI/developer sessions and record the factual baseline before rebuild work.
- Verification: frontend dependencies installed successfully; production build passed; lint completed with warnings; Laravel booted and registered 66 API routes; all 36 PHPUnit tests passed with an ephemeral test-only application key. MySQL/browser verification was not performed.
