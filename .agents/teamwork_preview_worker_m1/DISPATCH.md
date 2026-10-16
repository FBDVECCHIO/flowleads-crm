# Dispatch for Worker M1: Rebranding Total & Arquitetura Visual (Layout)

## Task Description
You are Worker M1 for FlowLeads by Grupo Mário Neto.
Your working directory is `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_worker_m1`.
You MUST read:
- ORIGINAL_REQUEST.md: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\ORIGINAL_REQUEST.md`
- PROJECT.md: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\PROJECT.md`
- Explorer 1 Report: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_explorer_survey_1\report.md`
- Explorer 1 Handoff: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_explorer_survey_1\handoff.md`

## MANDATORY INTEGRITY WARNING
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Milestone 1 Implementation Scope
1. **Total Rebranding**:
   - Completely eliminate all occurrences of "Pipefy" and "Acme Corp Brasil" across the entire codebase.
   - Replace with official visual identity: "FlowLeads by Grupo Mário Neto" (or "FlowLeads" with subtitle "by Grupo Mário Neto").
   - Update `Navbar.tsx`, `Sidebar.tsx`, `layout.tsx`, `page.tsx`, `login/page.tsx`, `database/page.tsx`, `reports/page.tsx`, `automations/page.tsx`, `globals.css`, `tailwind.config.cjs`, `cardService.ts`, `tests/full-flow.test.ts`, and `prisma/seed.ts`.
2. **Dynamic Collapsible Sidebar**:
   - Implement collapsible state in `src/components/layout/Sidebar.tsx`:
     - Toggle expand/collapse with button.
     - State saved to `localStorage` key `flowleads_sidebar_collapsed`.
     - When expanded: width `w-64`, full logo, subtitle "by Grupo Mário Neto", full menu labels.
     - When collapsed: width `w-16`, centered icons, floating tooltips on hover (`group-hover:flex` floating tooltip positioned to the right with z-50).
   - In `src/components/layout/AppShell.tsx`: support smooth transition of main content.
3. **Migrate Header Elements into Sidebar**:
   - Move User Profile (avatar, user name, role), Organization badge ("Grupo Mário Neto"), and Operational System Status ("Sistema Operacional Online") into `Sidebar.tsx` (organization under the logo, profile and status in sidebar footer).
   - Simplify `Navbar.tsx` into a clean Action Bar (Quick search, Pipe selector/title, Quick action trigger).
4. **Navigation Simplification**:
   - Remove "Database de Clientes" from the Sidebar navigation list.
   - Add "Gestão de Metas" (`/` or `/metas`) as the first navigation item (target icon `Target` or `TrendingUp`).

Write Ownership:
- You own:
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/Navbar.tsx`
  - `src/components/layout/AppShell.tsx`
  - `src/app/layout.tsx`
  - `src/app/globals.css`
  - `tailwind.config.cjs`
  - `src/app/auth/login/page.tsx`
  - `src/app/database/page.tsx`
  - `src/app/pipes/[id]/reports/page.tsx`
  - `src/app/pipes/[id]/automations/page.tsx`
  - `src/services/cardService.ts` (comment cleanup)
  - `tests/full-flow.test.ts`
  - `prisma/seed.ts`

Verification:
- Run `node --experimental-strip-types --test --test-concurrency=1 tests/*.test.ts`
- Run `npx next build`
Document exact results in your `handoff.md`. Notify parent via `send_message`.

## 2026-10-16T21:16:32Z
You are teamwork_preview_worker_m1.
Your working directory is C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_worker_m1.
Implement Milestone 1: Total Rebranding to "FlowLeads by Grupo Mário Neto", Dynamic Collapsible Sidebar with localStorage persistence and tooltips, migration of header elements into sidebar, and simplification of navigation.
Verify by running tests and build. Document in handoff.md and notify parent via send_message.

