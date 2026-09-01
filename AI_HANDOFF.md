# AI Handoff

- Last AI: Devin
- Phase completed: **PHASE 1H - Customers Migration**
- Status: complete and verified

## Completed

Migrated the Customers feature from TypeScript/TanStack Query to JavaScript/JSX with native React state/effects and the existing Axios `apiClient`. `CustomersPage.jsx` loads the customers list through local state and an effect; it reloads whenever `page`, `search`, or `hasDebt` changes, matching the former `['customers', { page, search, hasDebt }]` query key, and still sends `per_page: 15` with `has_debt` omitted when the filter is undefined. The create, update, payment, and delete mutations became explicit async handlers that call the same `POST /customers`, `PUT /customers/{id}`, `POST /customers/{id}/payment`, and `DELETE /customers/{id}` endpoints, refresh the list, and show the same success/error toasts with the same message fallbacks and the same modal/field resets. The two saving flags now come from `isSavingCustomer` and `isRecordingPayment` state instead of `mutation.isPending`. `customersApi.js` preserves every endpoint, query-parameter construction, payload, and response-unwrapping rule, so the POS quick-customer modal, the POS quick list, and the Dashboard keep working unchanged. Search, the debt filter, pagination, KPI cards, the outstanding-debt calculation, the delete confirmation, the name-required and positive-amount validations, credit-limit and balance display, loading and empty states, routes, Arabic/RTL text, and styling are unchanged.

## Files changed

- `frontend/src/features/customers/api/customersApi.js` replaces `customersApi.ts`
- `frontend/src/features/customers/pages/CustomersPage.jsx` replaces `CustomersPage.tsx`
- `PROJECT_STATUS.md`, `AI_HANDOFF.md`, `CHANGELOG.md`

## Files removed

- `frontend/src/features/customers/api/customersApi.ts`
- `frontend/src/features/customers/pages/CustomersPage.tsx`
- `frontend/src/features/customers/types/customerTypes.ts` and the now-empty `customers/types` directory

## Tests performed and results

- `frontend`: `npm install` - passed.
- `frontend`: `npm run lint` - passed with 16 warnings and no errors.
- `frontend`: `npm run build` - passed; `dist/assets/index-dFCY42j9.js` is 754.43 kB (205.25 kB gzip).
- Customers searches: no `.ts`/`.tsx` files and no `@tanstack/react-query`, `useQuery`, `useMutation`, or `useQueryClient` occurrences in `src/features/customers`.
- Reference searches: no `customerTypes` reference remains anywhere in `src`; the extensionless router import resolves `CustomersPage.jsx`; the POS page, the POS quick-customer modal, and the Dashboard resolve `customersApi.js`.

## Remaining migration counts

- TypeScript files: 36.
- TanStack Query feature areas: 2 - Suppliers, Expenses.

## Behavior differences

Customer changes no longer invalidate the `quick-customers` cache, because Customers no longer holds a query client. The Customers page refreshes its own list after every mutation, and POS reloads its quick-customer list on mount. All API calls, payloads, responses, and server-side business logic are unchanged.

## Known issues

Three still-TypeScript files in other features keep type-only imports of the deleted `products/types/productTypes` module (`suppliers`, `expenses`, `daily-closing`); they are erased at build time and disappear as each feature is migrated. `SalesPage.jsx` still contains the pre-existing double-encoded Arabic strings from Phase 1D; left untouched by explicit instruction. Frontend lint has 16 non-fatal warnings: thirteen `set-state-in-effect`, two Fast Refresh export warnings, and one React Hook Form compatibility warning. Vite still warns about the >500 kB JavaScript chunk. Verification ran on Linux with `npm`, not `npm.cmd`; the Linux `@oxlint/binding-linux-x64-gnu` and `@rolldown/binding-linux-x64-gnu` optional binaries were installed with `--no-save --no-package-lock`, leaving `package.json` and `package-lock.json` untouched.

## Exact next task

PHASE 1I - Suppliers feature migration only: inspect and convert `frontend/src/features/suppliers/**` from TypeScript/TanStack Query to JavaScript/local React/Axios state, removing its type-only `productTypes` import. Do not modify other feature modules and do not fix the Sales mojibake.
