# Dispatch for Worker M2: Gestão de Metas & Controle de Acesso por Horário/Dias (RBAC Avançado)

## Task Description
You are Worker M2 for FlowLeads by Grupo Mário Neto.
Your working directory is `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_worker_m2`.

You MUST read:
- ORIGINAL_REQUEST.md: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\ORIGINAL_REQUEST.md`
- PROJECT.md: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\PROJECT.md`
- TEST_INFRA.md: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\TEST_INFRA.md`
- Explorer 2 Report: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_explorer_survey_2\report.md`
- Explorer 2 Handoff: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_explorer_survey_2\handoff.md`

## MANDATORY INTEGRITY WARNING
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Milestone 2 Implementation Scope
1. **Prisma Schema & User Expansion**:
   - In `prisma/schema.prisma`, expand `User` model with:
     - `whatsappNumber String?`
     - `monthlyTargetAmount Float? @default(100000)`
     - `monthlyTargetDeals Int? @default(10)`
     - `allowedDays String? @default("1,2,3,4,5")` (0=Sun, 1=Mon ... 5=Fri, 6=Sat)
     - `workStartTime String? @default("08:00")`
     - `workEndTime String? @default("18:00")`
   - Run `npx prisma db push` or `npx prisma generate` to update types.
   - Update `prisma/seed.ts` with these fields for users (e.g. Carlos SDR with monthlyTargetAmount: 200000, whatsappNumber: "5511999999999").

2. **Work Schedule Access Control (`src/lib/auth.ts` & `/api/auth/login`)**:
   - Implement `checkScheduleAccess(user: { role: string; allowedDays?: string | null; workStartTime?: string | null; workEndTime?: string | null }, now?: Date)`:
     - If role is "ADMIN" or "SUPERVISOR", access is always allowed.
     - For "MEMBER" / operator: evaluate current day of week and time in `America/Sao_Paulo` (or simulated `now` parameter).
     - If current day is not in `allowedDays` (e.g. Saturday or Sunday), or current time is strictly before `workStartTime` (e.g. < 08:00) or strictly after `workEndTime` (e.g. > 18:00):
       - Return `{ allowed: false, reason: "Acesso fora da jornada de trabalho autorizada (Seg-Sex 08:00 às 18:00). Contate seu supervisor." }`.
     - Otherwise return `{ allowed: true }`.
   - In `src/app/api/auth/login/route.ts`:
     - After verifying password, call `checkScheduleAccess(user)`.
     - If not allowed, return `Response.json({ error: reason }, { status: 403 })`.

3. **Goal Calculation Service (`src/services/goalService.ts`) & API (`/api/goals`)**:
   - Implement `getUserGoal(userId: string)`:
     - Query user's assigned cards where `currentPhase.isFinalWon == true`.
     - Sum `dealValue` and count won cards.
     - Calculate attainment percentage: `(currentAmount / targetAmount) * 100`.
   - Implement `getTeamGoalRanking(organizationId: string)`:
     - Query all members in organization with their won deals, order by `currentAmount DESC`, and assign `rankingPosition`.
   - Expose `GET /api/goals`:
     - If user is supervisor/admin: returns both personal goal and full team ranking.
     - If user is member: returns only their personal goal.

4. **Default Post-Login Screen: "Gestão de Metas" (`src/app/page.tsx` & `src/components/goals/`)**:
   - Replace old pipe list in `src/app/page.tsx` with the complete "Gestão de Metas" dashboard.
   - Display personalized greeting: `"Bem-vindo - [Nome do Usuário]"`.
   - Render visual Thermometer/Progress Bar showing % of goal achieved, current amount vs target amount, deals won vs target deals.
   - If supervisor/admin: render Team Ranking table with podium/ranks, sales rep names, avatars, WhatsApp numbers, target vs achieved, and status.
   - Provide quick shortcut buttons to navigate to "Kanban de Leads" (`/pipes/[id]`) and "Relatórios & Funil".

5. **RBAC UI Governance**:
   - Operators (MEMBER): only see Gestão de Metas, Kanban de Leads, and Relatórios in navigation. Automations and sensitive settings are restricted.

Write Ownership:
- You own:
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
  - `src/lib/auth.ts`
  - `src/services/goalService.ts`
  - `src/app/api/goals/route.ts`
  - `src/app/api/auth/login/route.ts`
  - `src/app/page.tsx`
  - `src/components/goals/**`

Verification:
- Run `node --experimental-strip-types --test --test-concurrency=1 tests/*.test.ts`
- Run `node --experimental-strip-types --test tests/e2e/tier1-features.test.ts` (subtests F5 to F9 must pass)
- Run `node --experimental-strip-types --test tests/e2e/tier2-boundaries.test.ts` (schedule boundary tests must pass)
- Run `npx next build`

## 2026-10-16T21:44:10Z
You are teamwork_preview_worker_m2.
Your working directory is C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_worker_m2.
Implement Milestone 2: Gestão de Metas & Controle de Acesso por Horário/Dias (RBAC Avançado):
- Prisma schema User fields (whatsappNumber, monthlyTargetAmount, monthlyTargetDeals, allowedDays, workStartTime, workEndTime)
- checkScheduleAccess in src/lib/auth.ts (Seg-Sex 08:00-18:00 America/Sao_Paulo, HTTP 403 on login outside hours)
- src/services/goalService.ts (getUserGoal, getTeamGoalRanking calculated from won deals dealValue)
- src/app/api/goals/route.ts
- src/app/page.tsx: Default post-login Gestão de Metas screen with "Bem-vindo - [Nome]", thermometer, and ranking table
- Run tests and builds to verify. Document in handoff.md and notify parent via send_message when done.
