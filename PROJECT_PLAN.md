# Project Plan

This plan reflects the audited repository. Completion of a phase requires its stated verification, not merely code changes.

## PHASE 0 — Repository Audit

- Purpose: establish a factual baseline and persistent project memory.
- Dependencies: none.
- Expected work: inspect source, configuration, migrations, tests, dependencies, and working-tree state; run safe checks.
- Verification: audit findings and test results documented in project memory.

## PHASE 1 — Architecture & Stack Simplification

- Purpose: migrate the frontend from TypeScript and TanStack Query to JavaScript with React state/effects and Axios, without changing business behavior.
- Dependencies: Phase 0 baseline and module-by-module migration plan.
- Expected work: remove TypeScript build/configuration and Query provider/usage; review dependencies and documentation.
- Verification: production build, lint, and affected user-flow checks pass after each logical module.

## PHASE 2 — Environment & MySQL

- Purpose: make MySQL the documented and verified runtime database and remove prohibited runtime defaults where appropriate.
- Dependencies: Phase 1 decisions; local MySQL credentials.
- Expected work: reconcile Laravel defaults, queues/cache/session settings, setup files, CORS URLs, and safe test strategy.
- Verification: non-destructive migration/status and health checks against a dedicated MySQL database.

## PHASE 3 — Authentication

- Purpose: verify and harden Sanctum token authentication and frontend session handling.
- Dependencies: Phase 2 environment.
- Expected work: login/logout/profile flow, token lifecycle, authorization, CORS, and error handling.
- Verification: automated feature tests plus browser/API smoke tests.

## PHASE 4 — Dashboard

- Purpose: validate dashboard metrics and status presentation.
- Dependencies: products, sales, and reporting data contracts.
- Expected work: inspect metrics endpoints and dashboard states.
- Verification: API and responsive UI checks.

## PHASE 5 — Products

- Purpose: verify product, category, unit, barcode, and stock-adjustment behavior.
- Dependencies: Phase 3.
- Expected work: validate API contracts and UI flows.
- Verification: feature tests and user-flow smoke tests.

## PHASE 6 — Inventory

- Purpose: validate stock movements, stock quantities, and alerts.
- Dependencies: Phase 5.
- Expected work: reconcile ledger rules and inventory UI.
- Verification: transactional stock-flow tests.

## PHASE 7 — POS / Sales

- Purpose: validate authoritative sale calculations, payments, credit, voids, receipts, and stock decrements.
- Dependencies: Phases 3, 5, and 6.
- Expected work: preserve and test transactional sale services and POS UI.
- Verification: automated sale scenarios and real-user smoke tests.

## PHASE 8 — Purchases

- Purpose: validate supplier purchases, payments, stock increases, and voids.
- Dependencies: Phases 5 and 6.
- Expected work: API/UI flow review and service-rule tests.
- Verification: transactional purchase scenarios.

## PHASE 9 — Customers

- Purpose: validate customer records, credit limits, balances, and payments.
- Dependencies: Phase 7.
- Expected work: customer API/UI and ledger checks.
- Verification: credit and payment test scenarios.

## PHASE 10 — Suppliers

- Purpose: validate supplier records, payables, and payments.
- Dependencies: Phase 8.
- Expected work: supplier API/UI and ledger checks.
- Verification: payable and payment test scenarios.

## PHASE 11 — Expenses

- Purpose: validate expense categories, expense recording, and deletion policy.
- Dependencies: Phase 3.
- Expected work: expense API/UI checks.
- Verification: feature tests and UI smoke tests.

## PHASE 12 — Cash Sessions

- Purpose: validate open/close sessions, movements, and Z reports.
- Dependencies: Phase 7 and Phase 11.
- Expected work: session rules and cash reconciliation.
- Verification: reconciliation scenarios and Z-report checks.

## PHASE 13 — Reports

- Purpose: validate profit/loss, sales-tax, and top-products reporting.
- Dependencies: Phases 7, 8, 11, and 12.
- Expected work: reconcile report queries with transactional data.
- Verification: fixture-based financial totals and UI checks.

## PHASE 14 — Final QA

- Purpose: prove the complete system is deployable and understandable.
- Dependencies: all previous phases.
- Expected work: regression, responsive/RTL review, security review, setup verification, and documentation completion.
- Verification: clean install, automated suite, MySQL smoke test, and documented acceptance checklist.
