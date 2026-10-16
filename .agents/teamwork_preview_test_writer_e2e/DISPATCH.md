# Dispatch for E2E Test Writer: Comprehensive 4-Tier Test Suite

## Task Description
You are the dedicated E2E Test Writer for FlowLeads by Grupo Mário Neto.
Your working directory is `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_test_writer_e2e`.
You MUST read:
- ORIGINAL_REQUEST.md: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\ORIGINAL_REQUEST.md`
- PROJECT.md: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\PROJECT.md`
- TEST_INFRA.md: `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\TEST_INFRA.md`

Your mission:
Implement the complete opaque-box E2E test suite for the FlowLeads CRM restructuring across Tiers 1 to 4 under `tests/e2e/`:

1. `tests/e2e/tier1-features.test.ts`:
   - Feature coverage tests verifying in isolation each of the 22 features (F1 to F22):
     - F1: Total Rebranding (verify zero occurrences of "Pipefy" or "Acme" in files/strings).
     - F2: Dynamic collapsible sidebar (state toggle, localStorage persistence key, icon tooltips).
     - F3: Header elements migrated to sidebar (user avatar/name, Grupo Mário Neto badge, system status).
     - F4: Database de Clientes menu hidden.
     - F5: Post-login default landing on Metas with greeting "Bem-vindo - [Nome]".
     - F6: Goal thermometer & ranking calculation from won deals.
     - F7: RBAC role permissions (Supervisor vs Operator).
     - F8: Work schedule access control: login outside Seg-Sex 08:00-18:00 returns HTTP 403.
     - F9: Vendor WhatsApp binding to sales reps.
     - F10: Quick card creation and card deletion (DELETE /api/cards/[id]).
     - F11: 3-dots context menu actions (color, move phase, tags, attachments).
     - F12: Tag governance (operator blocked from creating new tags).
     - F13: Attachment upload and retrieval (prescriptions, proposals).
     - F14: Meta Ads webhook GET handshake (`hub.challenge`, `hub.verify_token`).
     - F15: Meta Ads webhook POST signature verification (`x-hub-signature-256`).
     - F16: Graph API leadgen_id data extraction into initial phase "Novo Lead".
     - F17: Intelligent routing of lead to sales rep WhatsApp.
     - F18: Password cryptography (bcrypt 12 rounds).
     - F19: Anti-session hijacking: HMAC signed session cookie & fingerprint check.
     - F20: Route handler RBAC guards.
     - F21: File upload sanitization (magic bytes, MIME type, extension).
     - F22: Serverless/cloud compatibility.

2. `tests/e2e/tier2-boundaries.test.ts`:
   - Boundary value & corner case tests:
     - Schedule boundaries: 07:59:59 (blocked 403), 08:00:00 (allowed 200), 18:00:00 (allowed 200), 18:00:01 (blocked 403), Saturdays and Sundays (blocked 403).
     - Webhook signature timing attacks / invalid signatures (HTTP 401/403).
     - Corrupted or tampered session cookie (HTTP 401).
     - Malicious file upload attempt (.exe / script disguised as .pdf/image, fake MIME type).
     - Non-supervisor attempting POST /api/labels (HTTP 403).

3. `tests/e2e/tier3-interactions.test.ts`:
   - Pairwise cross-feature interactions:
     - Supervisor configures sales rep with WhatsApp + target -> Meta webhook receives lead with rep's WhatsApp -> card created and assigned -> rep logs in during working hours -> moves card to Won -> rep's thermometer updates.
     - Operator attempts to create tag while moving card -> rejected, supervisor creates tag -> operator applies existing tag.

4. `tests/e2e/tier4-scenarios.test.ts`:
   - End-to-end commercial workflows:
     - Full sales cycle: Meta lead ingestion -> lead qualified BANT -> medical prescription attached and validated -> moved to Won -> supervisor checks ranking table and goal progress.

5. Create `TEST_READY.md` at project root summarizing all test cases and runner command (`node --experimental-strip-types --test --test-concurrency=1 tests/e2e/*.test.ts`).

Write ownership:
- You own `tests/e2e/**` and `TEST_READY.md`. DO NOT modify core application code in `src/`.

## 2026-10-16T21:16:32Z

You are teamwork_preview_test_writer_e2e.
Your working directory is C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_test_writer_e2e.
You MUST read:
- DISPATCH.md at C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_test_writer_e2e\DISPATCH.md
- ORIGINAL_REQUEST.md at C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\ORIGINAL_REQUEST.md
- PROJECT.md at C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\PROJECT.md
- TEST_INFRA.md at C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\TEST_INFRA.md

Create the comprehensive 4-tier E2E test suite under tests/e2e/ (tier1-features.test.ts, tier2-boundaries.test.ts, tier3-interactions.test.ts, tier4-scenarios.test.ts) and generate TEST_READY.md.
Document commands and verification in your handoff.md and notify parent via send_message when done.
