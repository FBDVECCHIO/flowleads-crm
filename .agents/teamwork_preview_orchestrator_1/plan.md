# Project Orchestration Plan: FlowLeads by Grupo Mário Neto

## Objective
Lead the complete transformation of the CRM into "FlowLeads by Grupo Mário Neto", fulfilling requirements R1 to R5 and passing all acceptance criteria with comprehensive automated tests and forensic verification.

## Phases

### Phase 0: Survey & Exploration
- Spawn 3 parallel Explorers:
  - Explorer 1 (Frontend & Branding): Investigate existing UI shell, layout, header, sidebar, Pipefy/Acme references, navigation items, and theme.
  - Explorer 2 (Auth, RBAC & Metas): Investigate auth mechanics, session handling, user models, role enforcement, default landing pages, and work hours logic.
  - Explorer 3 (Kanban, Meta Webhooks & Security): Investigate Kanban board implementation, card drawer/context menu, database schema/storage, Meta Ads webhook endpoint, file upload logic, and cloud readiness.

### Phase 1: Architecture & Decomposition
- Synthesize explorer findings into `PROJECT.md` (Architecture, Feature Inventory, Milestones M1-M5, Code Layout, Interfaces) and `TEST_INFRA.md`.
- Set up milestone folders under `.agents/`.

### Phase 2: Dual Track Execution
- **Track 1: E2E Testing Track**
  - Implement test runner, mocks (Meta Graph API, Webhook simulation, Auth simulation).
  - Write Tier 1 (Feature coverage), Tier 2 (Boundary & Corner), Tier 3 (Cross-feature), Tier 4 (Real-world scenarios).
  - Produce `TEST_READY.md`.
- **Track 2: Implementation Track (M1 -> M5)**
  - Milestone 1: Rebranding & UI Shell (Remove Pipefy/Acme, FlowLeads by Grupo Mário Neto, dynamic collapsible sidebar, simplify header).
  - Milestone 2: Gestão de Metas & Controle de Acesso (Post-login default screen "Bem-vindo - [Nome]", RBAC, Seg-Sex 08-18h work hour restriction HTTP 403, goal thermometer/ranking, WhatsApp assignment).
  - Milestone 3: Kanban Comercial Aprimorado (3-dots menu: change card color, direct move phase, restricted supervisor tags, secure file uploads/receipts).
  - Milestone 4: Ingestão de Leads Meta Ads (/api/webhooks/meta, hub.challenge, x-hub-signature-256, Graph API leadgen_id fetch, create in "Novo Lead", WhatsApp routing).
  - Milestone 5: Cibersegurança & Cloud Readiness (bcrypt salt rounds, session hijacking protection, route handler RBAC, MIME/extension upload sanitization, serverless/cloud DB & storage compatibility).

### Phase 3: Final Verification & Hardening
- Pass 100% of E2E tests (Tiers 1-4).
- Adversarial coverage hardening (Tier 5 Challenger loop).

### Phase 4: Audit & Completion
- Forensic Integrity Audit (`teamwork_preview_auditor`).
- Prepare final report and report completion to Sentinel.
