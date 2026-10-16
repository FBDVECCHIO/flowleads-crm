# Project: FlowLeads by Grupo Mário Neto

## Architecture
FlowLeads by Grupo Mário Neto is a high-performance commercial CRM built on Next.js 15 (App Router), React 19, Tailwind CSS, and Prisma ORM.

### High-Level Components
1. **Frontend UI Shell (`src/components/layout/`)**:
   - `Sidebar.tsx`: Dynamic collapsible sidebar with state persistence (`localStorage`), full width (`w-64`) with badges, branding, user info and status, collapsing to `w-16` with floating tooltips.
   - `Navbar.tsx`: Minimalist action bar focusing on global search, notifications, and new lead creation.
   - `AppShell.tsx`: Root responsive layout wrapper.
2. **Dashboard de Metas (`src/app/page.tsx`, `src/components/goals/`)**:
   - Default landing page upon login displaying "Bem-vindo - [Nome]".
   - Thermometer / progress indicators for individual and team revenue goals calculated from won deals (`dealValue` in `isFinalWon` phases).
   - Sales representative rankings and goal attainment metrics.
3. **Kanban Engine (`src/components/kanban/`, `src/services/cardService.ts`)**:
   - Board with phases, SLA indicators, and drag-and-drop / direct phase moving.
   - 3-dots contextual card menu: card color palette, direct phase jump, tag assignment (with supervisor-only creation rule), and attachment management (medical prescriptions/receipts).
   - Fast card creation and deletion (`DELETE /api/cards/[id]`) with confirmation modal.
4. **Auth & Security (`src/lib/auth.ts`, `src/app/api/auth/`)**:
   - Session signing with HMAC-SHA256 and User-Agent fingerprinting to prevent session hijacking.
   - RBAC middleware / route guards enforcing Supervisor vs Operator privileges.
   - Work schedule control (`checkScheduleAccess`): Seg-Sex 08:00-18:00 (`America/Sao_Paulo`) blocking operator login with friendly message and HTTP 403 Forbidden.
   - bcrypt password hashing with 12 salt rounds.
5. **Meta Ads Webhook Ingestion (`src/app/api/webhooks/meta/route.ts`)**:
   - Inbound webhook handler: GET handshake (`hub.challenge`), POST payload with timing-safe HMAC-SHA256 signature verification (`x-hub-signature-256`).
   - Lead extraction via Meta Graph API (`leadgen_id`).
   - Automated card insertion in "Novo Lead" phase.
   - Intelligent routing to assigned sales rep based on campaign/ad WhatsApp number.
6. **Storage & Cloud Readiness (`src/lib/storage.ts`, `src/lib/prisma.ts`)**:
   - File upload sanitization: MIME type verification, extension whitelist, and magic byte validation.
   - Storage abstraction for local vs Cloud/S3/Vercel Blob.
   - Database layer prepared for serverless deployment (Turso / PostgreSQL).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Total Rebranding | Complete removal of "Pipefy" and "Acme Corp Brasil" across 13 files and metadata | M1 | Survey 1, R1 (DONE) |
| F2 | Dynamic Collapsible Sidebar | Collapsible sidebar (w-64 to w-16) with floating tooltips on icons and persistent state | M1 | Survey 1, R1 (DONE) |
| F3 | Header Element Migration | Migration of User Profile, Organization badge ("Grupo Mário Neto"), and system status to Sidebar | M1 | Survey 1, R1 (DONE) |
| F4 | Navigation Simplification | Hiding "Database de Clientes" and streamlining commercial routes | M1 | Survey 1, R1 (DONE) |
| F5 | Post-Login Metas Screen | Default landing on "Gestão de Metas" with personalized "Bem-vindo - [Nome]" | M2 | Survey 2, R2 (DONE) |
| F6 | Goal Thermometer & Ranking | Visual thermometer and team ranking calculated from won deals | M2 | Survey 2, R2 (DONE) |
| F7 | RBAC Role Management | Supervisor (team, users, passwords, goals, permissions, WhatsApp) vs Operator permissions | M2 | Survey 2, R2 (DONE) |
| F8 | Work Schedule Access Control | Parameterized Seg-Sex 08:00-18:00 restriction with friendly message and HTTP 403 | M2 | Survey 2, R2 (DONE) |
| F9 | Vendor WhatsApp Binding | Linking sales rep WhatsApp number for lead routing and Meta Ads attribution | M2 | Survey 2, R2 (DONE) |
| F10 | Quick Card Ops & Deletion | Quick card creation and card deletion modal with DELETE /api/cards/[id] | M3 | Survey 3, R3 |
| F11 | Card Context Menu (3 dots) | 3-dots menu with color picker, direct move phase, tags, and attachments | M3 | Survey 3, R3 |
| F12 | Tag Governance | Applying tags with strict supervisor-only tag creation rule | M3 | Survey 3, R3 |
| F13 | Secure Attachment Management | Upload and viewing of attachments (prescriptions, proposals) with CardAttachment model | M3 | Survey 3, R3 |
| F14 | Meta Ads Webhook Verification | GET /api/webhooks/meta with hub.challenge and verify_token handshake | M4 | Survey 3, R4 |
| F15 | Meta Ads Webhook Signature | POST /api/webhooks/meta timing-safe HMAC-SHA256 x-hub-signature-256 validation | M4 | Survey 3, R4 |
| F16 | Graph API Lead Extraction | Fetch lead details (leadgen_id) and create card in "Novo Lead" phase | M4 | Survey 3, R4 |
| F17 | Intelligent WhatsApp Routing | Routing newly ingested leads to sales reps based on campaign WhatsApp number | M4 | Survey 3, R4 |
| F18 | Password Cryptography (bcrypt) | Elevate bcrypt salt rounds to 12 in seeds and user management | M5 | Survey 3, R5 |
| F19 | Anti-Session Hijacking | HMAC-SHA256 signed session cookie with client fingerprint validation | M5 | Survey 2 & 3, R5 |
| F20 | Route Handler RBAC Guards | Secure API route handlers against privilege escalation | M5 | Survey 2 & 3, R5 |
| F21 | MIME/Extension File Sanitization | Magic bytes, MIME type, and extension validation for uploaded files | M5 | Survey 3, R5 |
| F22 | Serverless / Cloud Readiness | Turso/PostgreSQL schema compatibility and blob storage abstraction | M5 | Survey 3, R5 |
| F23 | E2E Testing Suite (Tiers 1-4) | Systematic 4-tier opaque-box test suite verifying all 22 features | E2E | Plan, Original Request (ACTIVE - 154 tests) |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Rebranding Total & Arquitetura Visual | F1, F2, F3, F4 | none | DONE |
| M2 | Gestão de Metas & Controle de Acesso | F5, F6, F7, F8, F9 | M1 | DONE |
| M3 | Kanban Comercial Aprimorado & Menu | F10, F11, F12, F13 | M2 | READY_FOR_SUCCESSOR |
| M4 | Ingestão Automatizada de Leads Meta Ads | F14, F15, F16, F17 | M2, M3 | PLANNED |
| M5 | Cibersegurança & Prontidão para Deploy | F18, F19, F20, F21, F22 | M2, M3, M4 | PLANNED |
| E2E | E2E Testing Track | F23 (Tiers 1-4 opaque-box suite) | Parallel | DONE (154 tests) |

---

## Interface Contracts

### 1. Auth & Session Contract (`src/lib/auth.ts`)
```ts
export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "SUPERVISOR" | "MEMBER";
  organizationId: string;
  fingerprint: string; // hash of User-Agent
  issuedAt: number;
}

export function signSession(payload: SessionPayload): string;
export function verifySession(token: string, userAgent?: string): SessionPayload | null;
export function checkScheduleAccess(user: { role: string; allowedDays?: string; workStartTime?: string; workEndTime?: string }): { allowed: boolean; reason?: string };
export async function requireAuth(req: Request, allowedRoles?: string[]): Promise<SessionPayload>;
```

### 2. Goals & Metas Contract (`src/services/goalService.ts`)
```ts
export interface GoalProgress {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  targetDeals: number;
  currentDeals: number;
  dealsPercentage: number;
  rankingPosition: number;
}

export async function getUserGoal(userId: string): Promise<GoalProgress>;
export async function getTeamGoalRanking(organizationId: string): Promise<GoalProgress[]>;
```

### 3. Card Context & Operations Contract (`src/services/cardService.ts`)
```ts
export async function deleteCard(cardId: string, userId: string, userRole: string): Promise<void>;
export async function updateCardColor(cardId: string, color: string): Promise<Card>;
export async function addCardAttachment(cardId: string, fileData: { fileName: string; fileUrl: string; mimeType: string; sizeBytes: number }): Promise<CardAttachment>;
```

### 4. Meta Webhook Contract (`src/services/metaLeadService.ts`)
```ts
export interface MetaWebhookPayload {
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        leadgen_id: string;
        form_id: string;
        ad_id?: string;
        adset_id?: string;
        campaign_id?: string;
        created_time: number;
      };
    }>;
  }>;
}

export function verifyMetaSignature(rawBody: string, signatureHeader: string, appSecret: string): boolean;
export async function processMetaLead(leadgenId: string, pipeId: string): Promise<{ cardId: string; assignedToUserId: string | null }>;
```

---

## Code Layout
- `src/components/layout/`:
  - `AppShell.tsx`: Root responsive layout wrapper.
  - `Sidebar.tsx`: Collapsible dynamic sidebar with tooltips and moved profile/org badge.
  - `Navbar.tsx`: Minimalist action bar.
- `src/components/goals/`:
  - `GoalDashboard.tsx`: Welcome banner, personal goal thermometer, team ranking.
  - `GoalThermometer.tsx`: Visual progress thermometer component.
  - `GoalRankingTable.tsx`: Team ranking and metrics.
- `src/components/kanban/`:
  - `CardItem.tsx`: Card item with 3-dots action menu (color, move, tag, attachments).
  - `CardDrawer.tsx`: Lead detail drawer with prescription/attachment viewer.
  - `CardContextMenu.tsx`: 3-dots popover/dropdown menu.
- `src/lib/`:
  - `auth.ts`: HMAC session signing, schedule validation, RBAC guards.
  - `prisma.ts`: Prisma client instance.
  - `storage.ts`: File upload sanitization (magic bytes, MIME) and storage adapter.
  - `meta.ts`: Meta Graph API client and signature verification.
- `src/app/api/`:
  - `auth/login/route.ts`: Secure login with signed cookie and schedule enforcement (HTTP 403).
  - `auth/me/route.ts`: Session validation from signed cookie.
  - `webhooks/meta/route.ts`: Meta Ads webhook handshake and payload handler.
  - `cards/[id]/route.ts`: GET, PUT, and DELETE handlers.
  - `cards/[id]/attachments/route.ts`: Secure file upload handler.
  - `labels/route.ts`: Tag management with supervisor RBAC.
  - `goals/route.ts`: Goal metrics and ranking endpoint.
- `tests/`:
  - `e2e/`: Opaque-box E2E test suites (Tiers 1-4).
