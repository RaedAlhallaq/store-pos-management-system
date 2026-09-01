# Project Status

## Project overview

Store POS and management system with a React/Vite frontend and Laravel REST API backend for products, inventory, sales, purchases, customers, suppliers, expenses, cash sessions, and reports.

## Current technology stack

- Frontend: React 19, JavaScript foundation, Vite 8, Tailwind CSS 4, Axios, React Router 7, React Hook Form, Zod, Sonner, and Lucide.
- Remaining frontend migration work: 52 `.ts`/`.tsx` UI and feature files; 6 untouched feature pages still use TanStack Query.
- Backend: Laravel 13.29, PHP 8.4.23, Laravel Sanctum 4, REST API, Eloquent services/resources/form requests.
- Intended runtime database: MySQL/MariaDB. Environment examples specify MySQL.

## Forbidden technologies

TypeScript, TanStack Query, Redux, Zustand, SQLite, Redis, Docker, GraphQL, and unnecessary libraries. The shared foundation now complies with the TypeScript and TanStack Query restrictions; feature migrations remain.

## Current phase and task

- Current phase: **PHASE 1D - Sales Migration**
- Current task: Sales migration is complete and verified.

## Completed work

- Created the persistent project-memory system and completed the Phase 0 audit.
- Migrated the shared frontend runtime foundation to `.js`/`.jsx`: entry point, Vite config, providers, router/guard, layout/header/sidebar, Axios client, auth runtime, shared utilities, backend-status badge, and health-polling hook.
- Replaced shared TanStack Query health polling with `useBackendHealth`, using React state/effects and the existing Axios auth API.
- Removed the Query provider, TypeScript compiler step, direct TypeScript and React/Node type packages, and `tsconfig*.json` files.
- Migrated the Dashboard page to JavaScript with independent local React/Axios requests. The Dashboard no longer imports TanStack Query or contains TypeScript syntax.
- Migrated the complete POS feature to JavaScript/JSX, including the page, API module, all POS components, and the POS compatibility contract path. Replaced its TanStack queries/mutation with local React state/effects and explicit Axios-backed refresh functions.
- Migrated the Sales feature to `SalesPage.jsx`. Replaced its sales-list query and void mutation with local React state/effects, preserved every request filter and pagination parameter, reused the existing POS Axios sales client, and explicitly refreshes the list after a successful void.
- Removed the obsolete empty POS type compatibility module after confirming no source imports remained.
- Preserved existing user changes in SaleController, StoreSaleRequest, SaleService, SaleApiTest, PosPage, and docs/architecture.md.

## Verified functionality

- `frontend`: `npm.cmd install` passed after Phase 1A cleanup.
- `frontend`: `npm.cmd run lint` passed with 8 warnings and no errors.
- `frontend`: `npm.cmd run build` passed with `vite build`; output JavaScript is 755.82 kB (204.26 kB gzip).
- `frontend`: Phase 1B `npm.cmd install`, lint, and build passed; Dashboard has no TypeScript file or TanStack Query import.
- `frontend`: Phase 1C `npm.cmd install`, lint, and build passed; POS has no TypeScript file or TanStack Query import.
- `frontend`: Phase 1D `npm.cmd install`, lint, and build passed; Sales has no TypeScript file or TanStack Query import, and the extensionless router import resolves `SalesPage.jsx`.
- `backend`: Laravel booted; 66 API routes listed; tests passed 36/36 with an ephemeral test-only `APP_KEY` and the configured in-memory SQLite test database.

## Unverified functionality

- MySQL connectivity, migrations/seeders against MySQL, live health endpoint, Sanctum, CORS, and browser flows: no local runtime `.env` or safe MySQL target was available.

## Known issues

1. 52 `.ts`/`.tsx` files remain in UI and feature modules. They are intentionally out of scope for Phase 1D.
2. TanStack Query remains a direct dependency because six untouched feature pages still import it: Products, Inventory, Purchases, Customers, Suppliers, and Expenses.
3. Frontend lint has 9 warnings: six `set-state-in-effect`, two Fast Refresh export warnings, and one React Hook Form compatibility warning.
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

Continue Phase 1 with the Products feature only: convert it from TypeScript and TanStack Query to JavaScript with local React/Axios state, then rerun frontend install, lint, build, and remaining-usage searches. Do not modify other feature modules.
