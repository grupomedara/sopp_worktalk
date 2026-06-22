# System Optimization Plan (Safe & Premium)

## Goal
Improve system performance and perceived user experience through database indexing, smart code splitting, and premium micro-interactions, maintaining 100% stability.

## Tasks
- [x] **Task 1: Database Performance & Safety**
    - Add `@index` to `projectId`, `userId`, and `status` in key models (`Task`, `Finance`, `Objective`, `ObjectiveCard`).
    - Run `npx prisma migrate dev --name add_performance_indexes` to safely update the DB schema.
    - Verify: Check `schema.prisma` and ensure migrations are applied without data loss.

- [x] **Task 2: UI/UX Delight (Noir Aesthetic)**
    - Implement staggered entrance animations for Agile Cards and Finance Rows using Tailwind `animate-in` and `fade-in`.
    - Add hover-triggered glow effects to "Wheel of Life" categories in the Sidebar and Activity lists.
    - Verify: Open browser, verify smooth transitions and visual consistency.

- [x] **Task 3: Dynamic Module Loading**
    - Use Next.js `dynamic()` for heavy components like `ObjectiveDialog`, `FinanceForm`, and any RichText editors.
    - Move non-critical data fetching to `Suspense` boundaries in `(main)/agile/[projectId]/page.tsx`.
    - Verify: Check Network tab in DevTools for smaller entry bundles.

- [x] **Task 4: System-Wide Integration**
    - Audit `Sidebar.tsx` to ensure all 12 life areas have their unified color tokens.
    - Verify: All modules use the same color for "FINANCE" or "ESTUDO".

## Safety & Rollback Protocol
- **DB Check**: No tables or columns will be deleted or renamed. Only indexes will be added.
- **Rollback**: If any failure occurs, we rollback to the previous Git commit `ab6f140`.
- **Validation**: Every step will be followed by `npm run lint` and a manual sanity check.

## Done When
- [ ] Database queries are optimized with indexes.
- [ ] UI feels alive with staggered entrance animations.
- [ ] Initial bundle size is reduced.
- [ ] 100% of existing features remain functional.
