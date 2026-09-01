# Project Status

## Project overview

Store POS and management system with a React/Vite frontend and Laravel REST API backend for products, inventory, sales, purchases, customers, suppliers, expenses, cash sessions, and reports.

## Current technology stack

- Frontend: React 19, JavaScript foundation, Vite 8, Tailwind CSS 4, Axios, React Router 7, React Hook Form, Zod, Sonner, and Lucide.
- Remaining frontend migration work: 44 `.ts`/`.tsx` UI and feature files; 5 untouched feature pages still use TanStack Query.
- Backend: Laravel 13.29, PHP 8.4.23, Laravel Sanctum 4, REST API, Eloquent services/resources/form requests.
- Intended runtime database: MySQL/MariaDB. Environment examples specify MySQL.

## Forbidden technologies

TypeScript, TanStack Query, Redux, Zustand, SQLite, Redis, Docker, GraphQL, and unnecessary libraries. The shared foundation now complies with the TypeScript and TanStack Query restrictions; feature migrations remain.

## Current phase and task

- Current phase: **PHASE 1E - Products Migration**
- Current task: Products migration is complete and verified.

## Completed work

- Created the persistent project-memory system and completed the Phase 0 audit.
- Migrated the shared frontend runtime foundation to `.js`/`.jsx`: entry point, Vite config, providers, router/guard, layout/header/sidebar, Axios client, auth runtime, shared utilities, backend-status badge, and health-polling hook.
- Replaced shared TanStack Query health polling with `useBackendHealth`, using React state/effects and the existing Axios auth API.
- Removed the Query provider, TypeScript compiler step, direct TypeScript and React/Node type packages, and `tsconfig*.json` files.
- Migrated the Dashboard page to JavaScript with independent local React/Axios requests. The Dashboard no longer imports TanStack Query or contains TypeScript syntax.
- Migrated the complete POS feature to JavaScript/JSX, including the page, API module, all POS components, and the POS compatibility contract path. Replaced its TanStack queries/mutation with local React state/effects and explicit Axios-backed refresh functions.
- Migrated the Sales feature to `SalesPage.jsx`. Replaced its sales-list query and void mutation with local React state/effects, preserved every request filter and pagination parameter, reused the existing POS Axios sales client, and explicitly refreshes the list after a successful void.
- Removed the obsolete empty POS type compatibility module after confirming no source imports remained.
- Migrated the complete Products feature to JavaScript/JSX: page, API module, filter bar, product modal, category modal, unit modal, and stock-adjustment modal. Replaced its four queries and four mutations with local React state/effects and explicit Axios-backed refresh functions, and deleted the Products type module.
- Preserved existing user changes in SaleController, StoreSaleRequest, SaleService, SaleApiTest, PosPage, and docs/architecture.md.

## Verified functionality

- `frontend`: `npm.cmd install` passed after Phase 1A cleanup.
- `frontend`: `npm.cmd run lint` passed with 8 warnings and no errors.
- `frontend`: `npm.cmd run build` passed with `vite build`; output JavaScript is 755.82 kB (204.26 kB gzip).
- `frontend`: Phase 1B `npm.cmd install`, lint, and build passed; Dashboard has no TypeScript file or TanStack Query import.
- `frontend`: Phase 1C `npm.cmd install`, lint, and build passed; POS has no TypeScript file or TanStack Query import.
- `frontend`: Phase 1D `npm.cmd install`, lint, and build passed; Sales has no TypeScript file or TanStack Query import, and the extensionless router import resolves `SalesPage.jsx`.
- `frontend`: Phase 1E `npm install`, lint (11 warnings, no errors), and build passed; Products has no TypeScript file and no TanStack Query import or usage, and the extensionless router import resolves `ProductsPage.jsx`.
- `backend`: Laravel booted; 66 API routes listed; tests passed 36/36 with an ephemeral test-only `APP_KEY` and the configured in-memory SQLite test database.

## Unverified functionality

- MySQL connectivity, migrations/seeders against MySQL, live health endpoint, Sanctum, CORS, and browser flows: no local runtime `.env` or safe MySQL target was available.

## Known issues

1. 44 `.ts`/`.tsx` files remain in UI and feature modules. They are intentionally out of scope for Phase 1E.
2. TanStack Query remains a direct dependency because five untouched feature pages still import it: Inventory, Purchases, Customers, Suppliers, and Expenses.
3. Frontend lint has 11 warnings: eight `set-state-in-effect`, two Fast Refresh export warnings, and one React Hook Form compatibility warning.
7. Eight still-TypeScript files in other features keep type-only imports of the deleted `products/types/productTypes` module (`inventory`, `purchases` x3, `customers`, `suppliers`, `expenses`, `daily-closing`). These imports are erased at build time, so install, lint, and the production build pass; each one disappears when its own feature is migrated.
8. Adjusting stock from Products no longer invalidates the Inventory page's `stock-movements` cache, because Products no longer holds a query client. Inventory still refetches on mount and after its own adjustments.
9. `frontend/src/features/sales/pages/SalesPage.jsx` contains double-encoded (mojibake) Arabic strings introduced before Phase 1E. Its UI text renders incorrectly. Out of scope for Phase 1E; fix during a Sales follow-up.
10. `npm.cmd` is Windows-only. On the Linux verification machine the equivalent `npm install`, `npm run lint`, and `npm run build` were used, plus the Linux-only `@oxlint/binding-linux-x64-gnu` and `@rolldown/binding-linux-x64-gnu` optional binaries, installed with `--no-save --no-package-lock` so `package.json` and `package-lock.json` stayed unchanged.
4. Vite warns that the generated JavaScript chunk is 755.90 kB before gzip, above its default 500 kB threshold.
5. Laravel defaults to SQLite without `backend/.env`, and config retains SQLite/Redis definitions. PHPUnit deliberately uses in-memory SQLite. This requires a Phase 2 MySQL/test-strategy decision.
6. Git safe-directory ownership warning occurs for this sandbox identity unless commands use a one-command override. No global git configuration was changed.

## Blocked issues

- MySQL runtime verification requires a configured local `backend/.env` and a confirmed safe database target.

## Important architectural decisions

- Axios remains the sole API client. It preserves the configured base URL, Bearer token attachment, and global 401 cleanup/redirect behavior.
- `useBackendHealth` preserves the existing 30-second header poll, 15-second status-badge poll, retry-once behavior, and manual refresh without a query library.
- The backend retains transactional, server-authoritative financial and stock logic. No business API contracts were changed.

## Exact next task

PHASE 1F - Inventory feature migration only: convert `frontend/src/features/inventory/**` from TypeScript and TanStack Query to JavaScript with local React/Axios state, then rerun frontend install, lint, build, and remaining-usage searches. Do not modify other feature modules.
