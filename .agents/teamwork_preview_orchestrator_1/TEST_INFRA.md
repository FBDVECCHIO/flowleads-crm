# E2E Test Infra: FlowLeads by Grupo Mário Neto

## Test Philosophy
- Opaque-box, requirement-driven. Derived from ORIGINAL_REQUEST.md. No dependency on implementation design.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | F1. Rebranding Total | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | F2. Dynamic Collapsible Sidebar | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | F3. Header Element Migration | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | F4. Navigation Simplification | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | F5. Post-Login Metas Screen | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 6 | F6. Goal Thermometer & Ranking | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 7 | F7. RBAC Role Management | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | F8. Work Schedule Access Control (HTTP 403) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 9 | F9. Vendor WhatsApp Binding | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 10 | F10. Quick Card Ops & Deletion | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 11 | F11. Card Context Menu (3 dots) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 12 | F12. Tag Governance (Supervisor-only) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 13 | F13. Secure Attachment Management | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 14 | F14. Meta Ads Webhook Verification | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 15 | F15. Meta Ads Webhook Signature | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 16 | F16. Graph API Lead Extraction | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 17 | F17. Intelligent WhatsApp Routing | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 18 | F18. Password Cryptography (bcrypt 12) | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 19 | F19. Anti-Session Hijacking | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 20 | F20. Route Handler RBAC Guards | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 21 | F21. MIME/Extension File Sanitization | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 22 | F22. Serverless / Cloud Readiness | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |

## Test Architecture
- Test Runner: Node.js native test runner (`node --experimental-strip-types --test --test-concurrency=1 tests/e2e/*.test.ts`)
- Pass/Fail semantics: Exit code 0, all assertions pass.
- Test case directory: `tests/e2e/`
  - `tier1-features.test.ts`
  - `tier2-boundaries.test.ts`
  - `tier3-interactions.test.ts`
  - `tier4-scenarios.test.ts`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Meta Ad Click-to-WhatsApp Ingestion to Won Deal | F14, F15, F16, F17, F10, F11, F6 | High |
| 2 | Medical Prescription Attachment & Doctor BANT Qualification | F11, F13, F21, F10, F12 | High |
| 3 | Operator Login Schedule Enforcement & Violation Logging | F8, F7, F19, F20 | High |
| 4 | Supervisor Team Target Setup & Live Real-Time Attainment | F5, F6, F7, F9 | High |
| 5 | Tag Governance & Card Color Organization Under RBAC | F11, F12, F7, F20 | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature
- Tier 2: ≥5 per feature (where boundaries exist)
- Tier 3: Pairwise coverage of major feature interactions
- Tier 4: ≥5 realistic commercial scenarios
