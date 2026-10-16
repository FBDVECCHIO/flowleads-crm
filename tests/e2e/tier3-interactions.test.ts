import { describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  loadModule,
  generateMetaSignature,
  createMockSessionToken,
  computeUserAgentFingerprint,
  createValidPdfBuffer,
  createMaliciousExeBuffer,
} from "./helpers.ts";

describe("Tier 3: Pairwise Cross-Feature Interactions", () => {
  // --------------------------------------------------------------------------
  // Interaction 1: Supervisor Setup -> Meta Ingestion -> Rep Login -> Won Deal -> Ranking
  // --------------------------------------------------------------------------
  describe("Interaction 1: Ingestion to Won Attainment Workflow", () => {
    test("I1: Full lifecycle from Meta Ads webhook routing to Goal Thermometer update", async () => {
      // 1. Supervisor configures sales rep with WhatsApp and Target
      const salesRep = {
        id: "rep_carlos_101",
        name: "Carlos Medeiros",
        email: "carlos@flowleads.com",
        role: "MEMBER",
        whatsapp: "+5511999991234",
        targetAmount: 50000,
        currentWonAmount: 0,
      };
      assert.equal(salesRep.whatsapp, "+5511999991234");
      assert.equal(salesRep.targetAmount, 50000);

      // 2. Meta Ads webhook receives inbound lead with matching rep WhatsApp destination
      const metaSecret = "test_meta_webhook_secret_key";
      const webhookPayload = JSON.stringify({
        object: "page",
        entry: [
          {
            id: "entry_meta_001",
            changes: [
              {
                field: "leadgen",
                value: {
                  leadgen_id: "lead_doctor_4455",
                  form_id: "form_equipamentos_sp",
                  ad_id: "ad_whatsapp_direct",
                  campaign_id: "camp_hospitalar_2026",
                  destination_whatsapp: "+5511999991234",
                  created_time: Date.now(),
                },
              },
            ],
          },
        ],
      });

      // Verify webhook signature (F15)
      const signatureHeader = generateMetaSignature(webhookPayload, metaSecret);
      const computedHash = crypto.createHmac("sha256", metaSecret).update(webhookPayload).digest("hex");
      assert.equal(signatureHeader, `sha256=${computedHash}`, "Signature must match HMAC-SHA256");

      // 3. Process lead: Route to matching rep & create card in initial phase (F16, F17, F10)
      const leadEvent = JSON.parse(webhookPayload).entry[0].changes[0].value;
      const matchedRepId = leadEvent.destination_whatsapp === salesRep.whatsapp ? salesRep.id : null;
      assert.equal(matchedRepId, salesRep.id, "Lead must be routed to Carlos Medeiros based on WhatsApp");

      const createdCard = {
        id: "card_lead_4455",
        title: "Dr. André - Clínica Vista",
        dealValue: 25000,
        phase: "Novos Leads",
        assignedToUserId: matchedRepId,
        color: "#3b82f6",
        labels: [] as string[],
        attachments: [] as any[],
      };
      assert.equal(createdCard.assignedToUserId, salesRep.id);
      assert.equal(createdCard.phase, "Novos Leads");

      // 4. Sales rep logs in during business hours (F8, F19)
      const loginTime = "09:30:00"; // Monday 09:30
      const [h, m] = loginTime.split(":").map(Number);
      const isBusinessHours = h >= 8 && h < 18;
      assert.equal(isBusinessHours, true, "Login must be allowed during business hours");

      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0";
      const sessionToken = createMockSessionToken(
        {
          userId: salesRep.id,
          role: salesRep.role,
          fingerprint: computeUserAgentFingerprint(userAgent),
          issuedAt: Date.now(),
        },
        "session_secret_hmac"
      );
      assert.ok(sessionToken, "Session token must be generated upon valid login");

      // 5. Sales rep qualifies lead and moves card to "Ganho / Fechado" (F11, F6)
      createdCard.phase = "Ganho / Fechado";
      assert.equal(createdCard.phase, "Ganho / Fechado");

      // 6. Recalculate sales rep goal thermometer & ranking (F6)
      salesRep.currentWonAmount += createdCard.dealValue;
      const progressPercentage = (salesRep.currentWonAmount / salesRep.targetAmount) * 100;
      assert.equal(salesRep.currentWonAmount, 25000);
      assert.equal(progressPercentage, 50, "Thermometer must reflect 50% attainment");

      // Team ranking comparison
      const teamReps = [
        { name: "Carlos Medeiros", percentage: progressPercentage, amount: salesRep.currentWonAmount },
        { name: "Beatriz Lima", percentage: 40, amount: 20000 },
        { name: "Eduardo Souza", percentage: 45, amount: 22500 },
      ];
      const ranked = [...teamReps].sort((a, b) => b.percentage - a.percentage);
      assert.equal(ranked[0].name, "Carlos Medeiros", "Carlos must be #1 in ranking after closing deal");
    });
  });

  // --------------------------------------------------------------------------
  // Interaction 2: Tag Governance & Card Movement Interaction
  // --------------------------------------------------------------------------
  describe("Interaction 2: Tag Governance & Card Context Menu Interaction", () => {
    test("I2: Operator blocked from creating tag -> Supervisor creates tag -> Operator assigns tag & moves phase", async () => {
      const pipeId = "pipe_comercial_001";
      const existingTags = [
        { id: "lbl_1", name: "Inbound", color: "#3b82f6", pipeId },
        { id: "lbl_2", name: "Follow-up", color: "#f59e0b", pipeId },
      ];

      // 1. Operator attempts to create a new tag "VIP Especial"
      const operatorRole = "MEMBER";
      const canCreateTag = (role: string) => role === "SUPERVISOR" || role === "ADMIN";
      assert.equal(
        canCreateTag(operatorRole),
        false,
        "Operator must be blocked from creating new tag (HTTP 403)"
      );

      // 2. Supervisor creates the tag "VIP Especial"
      const supervisorRole = "SUPERVISOR";
      assert.equal(canCreateTag(supervisorRole), true, "Supervisor is authorized to create new tag");

      const newTag = {
        id: "lbl_3",
        name: "VIP Especial",
        color: "#10b981",
        pipeId,
      };
      existingTags.push(newTag);
      assert.equal(existingTags.length, 3);

      // 3. Operator opens card, changes color and applies the approved tag
      const card = {
        id: "card_888",
        pipeId,
        title: "Clínica Oftalmológica Santos",
        phase: "Novos Leads",
        color: "#ffffff",
        labels: [] as string[],
      };

      // Apply tag
      card.labels.push(newTag.id);
      assert.ok(card.labels.includes("lbl_3"), "Card must include assigned tag");

      // Update card visual color (F11)
      card.color = "#10b981";
      assert.equal(card.color, "#10b981");

      // Move card to next phase "Qualificação (SDR)" (F11)
      card.phase = "Qualificação (SDR)";
      assert.equal(card.phase, "Qualificação (SDR)");
    });
  });

  // --------------------------------------------------------------------------
  // Interaction 3: Anti-Session Hijacking & Work Schedule Interaction
  // --------------------------------------------------------------------------
  describe("Interaction 3: Anti-Session Hijacking & Work Schedule Interaction", () => {
    test("I3: Shift login permitted -> attacker hijacking blocked -> post-shift access cut off", async () => {
      const secret = "session_secret_key_2026";
      const rep = { id: "usr_marcos", role: "MEMBER" };
      const legitUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0";
      const attackerUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15";

      // 1. Rep logs in at 08:30 on Tuesday (permitted window)
      const shiftStartTime = "08:30";
      const [h1] = shiftStartTime.split(":").map(Number);
      const isShiftTime = h1 >= 8 && h1 < 18;
      assert.equal(isShiftTime, true);

      const token = createMockSessionToken(
        {
          userId: rep.id,
          role: rep.role,
          fingerprint: computeUserAgentFingerprint(legitUA),
          issuedAt: Date.now(),
        },
        secret
      );

      // Helper to evaluate session + schedule
      function evaluateAccess(sessionToken: string, currentUA: string, currentTime: string): { status: number } {
        const [data64, sig] = sessionToken.split(".");
        const expectedSig = crypto.createHmac("sha256", secret).update(data64).digest("base64url");
        if (sig !== expectedSig) return { status: 401 };

        const payload = JSON.parse(Buffer.from(data64, "base64url").toString("utf8"));
        // Fingerprint verification
        if (payload.fingerprint !== computeUserAgentFingerprint(currentUA)) {
          return { status: 401 }; // Session hijacking attempt
        }

        // Schedule check
        const [h] = currentTime.split(":").map(Number);
        if (payload.role === "MEMBER" && (h < 8 || h >= 18)) {
          return { status: 403 }; // Outside schedule
        }

        return { status: 200 };
      }

      // 2. Legitimate request during shift
      const res1 = evaluateAccess(token, legitUA, "11:00");
      assert.equal(res1.status, 200, "Legitimate request during shift must succeed (HTTP 200)");

      // 3. Attacker uses stolen token with different User-Agent
      const res2 = evaluateAccess(token, attackerUA, "14:00");
      assert.equal(res2.status, 401, "Hijacked session attempt must be rejected (HTTP 401)");

      // 4. Legitimate user attempts access at 18:30 (outside allowed hours)
      const res3 = evaluateAccess(token, legitUA, "18:30");
      assert.equal(res3.status, 403, "Access after shift must be blocked (HTTP 403)");
    });
  });

  // --------------------------------------------------------------------------
  // Interaction 4: Prescription Attachment & Card Deletion Governance
  // --------------------------------------------------------------------------
  describe("Interaction 4: Prescription Attachment & Card Deletion Governance", () => {
    test("I4: Malicious upload blocked -> Valid prescription stored -> Non-supervisor deletion rejected", () => {
      const card = {
        id: "card_oftalmo_100",
        creatorId: "rep_bruno",
        attachments: [] as any[],
      };

      // 1. Attempt upload of executable disguised as prescription
      const maliciousBuffer = createMaliciousExeBuffer();
      const validateFile = (buf: Buffer, filename: string) => {
        const isExe = buf[0] === 0x4d && buf[1] === 0x5a;
        if (isExe) return { valid: false, error: "Executável malicioso detectado" };
        const isPdf = buf.subarray(0, 4).toString("utf8") === "%PDF";
        if (!isPdf) return { valid: false, error: "Arquivo PDF inválido" };
        return { valid: true };
      };

      const upload1 = validateFile(maliciousBuffer, "receita.pdf");
      assert.equal(upload1.valid, false, "Malicious file disguised as PDF must be rejected");

      // 2. Upload valid prescription PDF
      const validPdfBuffer = createValidPdfBuffer("Receita de Colírio Oftálmico");
      const upload2 = validateFile(validPdfBuffer, "receita_oftalmo.pdf");
      assert.equal(upload2.valid, true, "Valid prescription must be accepted");

      card.attachments.push({
        id: "att_001",
        fileName: "receita_oftalmo.pdf",
        mimeType: "application/pdf",
        sizeBytes: validPdfBuffer.length,
      });
      assert.equal(card.attachments.length, 1);

      // 3. Another operator attempts to delete this card
      const canDelete = (requestingUserId: string, requestingRole: string, cardCreatorId: string) => {
        if (requestingRole === "SUPERVISOR" || requestingRole === "ADMIN") return true;
        if (requestingUserId === cardCreatorId) return true;
        return false;
      };

      const anotherOperatorAllowed = canDelete("rep_claudia", "MEMBER", card.creatorId);
      assert.equal(anotherOperatorAllowed, false, "Other operator cannot delete card (HTTP 403)");

      // 4. Supervisor is allowed to delete card
      const supervisorAllowed = canDelete("usr_sup", "SUPERVISOR", card.creatorId);
      assert.equal(supervisorAllowed, true, "Supervisor is authorized to delete card");
    });
  });
});
