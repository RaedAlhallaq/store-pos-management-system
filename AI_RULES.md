# AI Working Rules

1. Read `AI_RULES.md`, `PROJECT_STATUS.md`, `PROJECT_PLAN.md`, and `AI_HANDOFF.md` before changing code.
2. Work on one project phase and one logical task at a time. Do not begin a later phase early.
3. Execute scoped changes; do not only describe proposed changes.
4. Test every meaningful change and record the command and result. Never claim a result that was not verified.
5. Keep the target stack simple: React, JavaScript, JSX, Vite, Tailwind CSS, and IndexedDB.
6. Do NOT use: TypeScript, TanStack Query, Redux, Zustand, Axios, Laravel, PHP, MySQL, Node.js backend, SQLite, Redis, Docker, GraphQL, or unnecessary dependencies.
7. The backend is NOT part of this project. It will be implemented separately later by another developer.
8. Preserve working business logic, especially financial, stock, audit-trail, and authentication behavior.
9. Avoid unrelated refactors. Preserve user changes already present in the working tree.
10. Update project-memory files after meaningful work. Record incomplete work and the exact continuation action in `AI_HANDOFF.md`.
11. When approaching a tool or context limit, stop safely: verify what is possible, update project memory, and leave no undocumented half-completed work.
12. All data storage is local (IndexedDB). No server communication. Authentication is local demo auth only.
