# AI Handoff

- Last AI: Devin
- Phase completed: **PHASE 1G - Purchases Migration**
- Status: complete and verified

## Completed

Migrated the Purchases feature from TypeScript/TanStack Query to JavaScript/JSX with native React state/effects and the existing Axios `apiClient`. `PurchasesPage.jsx` loads the purchases list, the supplier quick list, and the product select list through local state and effects; the list reloads whenever `page`, `search`, `paymentStatus`, `purchaseStatus`, `dateFrom`, or `dateTo` changes, matching the former query key, and still sends `per_page: 15` with only the non-empty filters. The create and void mutations became explicit async handlers that call the same `POST /purchases` and `POST /purchases/{id}/void` endpoints, then refresh the purchases list, the product list, and the supplier list, and show the same success/error toasts with the same message fallbacks. `PurchaseModal.jsx` keeps its multi-item table, product-driven cost/selling/tax defaults, add/remove row rules, the credit-requires-supplier guard, and the subtotal/tax/discount/grand-total calculations unchanged; the saving flag now comes from page state instead of `mutation.isPending`. `purchasesApi.js` preserves every endpoint, query-parameter construction, payload, and response-unwrapping rule. KPI cards, filters with page reset, filter reset, pagination, table rendering, badges, loading and empty states, routes, Arabic/RTL text, and styling are unchanged.

## Files changed

- `frontend/src/features/purchases/api/purchasesApi.js` replaces `purchasesApi.ts`
- `frontend/src/features/purchases/components/PurchaseModal.jsx` replaces `PurchaseModal.tsx`
- `frontend/src/features/purchases/pages/PurchasesPage.jsx` replaces `PurchasesPage.tsx`
- `PROJECT_STATUS.md`, `AI_HANDOFF.md`, `CHANGELOG.md`

## Files removed

- `frontend/src/features/purchases/api/purchasesApi.ts`
- `frontend/src/features/purchases/components/PurchaseModal.tsx`
- `frontend/src/features/purchases/pages/PurchasesPage.tsx`
- `frontend/src/features/purchases/types/purchaseTypes.ts` and the now-empty `purchases/types` directory

## Tests performed and results

- `frontend`: `npm install` - passed.
- `frontend`: `npm run lint` - passed with 15 warnings and no errors.
- `frontend`: `npm run build` - passed; `dist/assets/index-BuYuiOmv.js` is 754.93 kB (205.25 kB gzip).
- Purchases searches: no `.ts`/`.tsx` files and no `@tanstack/react-query`, `useQuery`, `useMutation`, or `useQueryClient` occurrences in `src/features/purchases`.
- Reference searches: no `purchaseTypes` reference remains anywhere in `src`; the extensionless router import resolves `PurchasesPage.jsx`; the Dashboard's `purchasesApi` import resolves `purchasesApi.js`; Purchases still resolves `suppliersApi` and `productsApi`.

## Remaining migration counts

- TypeScript files: 39.
- TanStack Query feature areas: 3 - Customers, Suppliers, Expenses.

## Behavior differences

Creating or voiding a purchase no longer invalidates the Products, Inventory, and metrics query caches, because Purchases no longer holds a query client. It refreshes its own purchases list plus the product and supplier lists it uses; the Products and Inventory pages pick up the new stock on their own next load. All API calls, payloads, responses, and server-side business logic are unchanged.

## Known issues

Four still-TypeScript files in other features keep type-only imports of the deleted `products/types/productTypes` module (`customers`, `suppliers`, `expenses`, `daily-closing`); they are erased at build time and disappear as each feature is migrated. `SalesPage.jsx` still contains the pre-existing double-encoded Arabic strings from Phase 1D; left untouched by explicit instruction. Frontend lint has 15 non-fatal warnings: twelve `set-state-in-effect`, two Fast Refresh export warnings, and one React Hook Form compatibility warning. Vite still warns about the >500 kB JavaScript chunk. Verification ran on Linux with `npm`, not `npm.cmd`; the Linux `@oxlint/binding-linux-x64-gnu` and `@rolldown/binding-linux-x64-gnu` optional binaries were installed with `--no-save --no-package-lock`, leaving `package.json` and `package-lock.json` untouched.

## Exact next task

PHASE 1H - Customers feature migration only: inspect and convert `frontend/src/features/customers/**` from TypeScript/TanStack Query to JavaScript/local React/Axios state, removing its type-only `productTypes` import. Do not modify other feature modules and do not fix the Sales mojibake.
