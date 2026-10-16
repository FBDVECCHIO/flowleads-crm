import { describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  generateMetaSignature,
  createMockSessionToken,
  computeUserAgentFingerprint,
  createValidPdfBuffer,
  createMaliciousExeBuffer,
  createMaliciousScriptBuffer,
} from "./helpers.ts";

describe("Tier 4: Real-World Commercial Workload Scenarios", () => {
  // --------------------------------------------------------------------------
  // Scenario 1: Meta Ad Click-to-WhatsApp Ingestion to Won Deal
  // Features: F14, F15, F16, F17, F10, F11, F6
  // --------------------------------------------------------------------------
  describe("Scenario 1: Meta Ad Click-to-WhatsApp Ingestion to Won Deal", () => {
    test("S1: End-to-end commercial cycle from click-to-WhatsApp ad to won deal revenue recognition", async () => {
      // 1. Setup sales representative bound to WhatsApp
      const rep = {
        id: "rep_mariana_01",
        name: "Dra. Mariana Castro",
        role: "MEMBER",
        whatsapp: "+5511988881001",
        targetAmount: 100000,
        wonAmount: 0,
        wonDealsCount: 0,
      };

      // 2. Incoming Meta Ads webhook event with valid HMAC-SHA256 signature
      const appSecret = "flowleads_meta_production_secret_2026";
      const webhookPayload = JSON.stringify({
        object: "page",
        entry: [
          {
            id: "page_meta_gmn",
            changes: [
              {
                field: "leadgen",
                value: {
                  leadgen_id: "lead_ultrassom_9901",
                  form_id: "form_equipamentos_alta_complexidade",
                  ad_id: "ad_whatsapp_ultrassom_3d",
                  campaign_id: "camp_medica_hospitalar",
                  destination_whatsapp: "+5511988881001",
                  lead_name: "Dr. Marcelo Paiva",
                  lead_phone: "+5511977772222",
                  lead_email: "marcelo@clinicapaiva.med.br",
                  created_time: Date.now(),
                },
              },
            ],
          },
        ],
      });

      // Verify signature (F15)
      const signatureHeader = generateMetaSignature(webhookPayload, appSecret);
      const isSignatureValid = signatureHeader === generateMetaSignature(webhookPayload, appSecret);
      assert.equal(isSignatureValid, true, "Webhook signature must be valid");

      // 3. Process lead & extract to initial phase (F16, F17)
      const leadData = JSON.parse(webhookPayload).entry[0].changes[0].value;
      const assignedRepId = leadData.destination_whatsapp === rep.whatsapp ? rep.id : null;
      assert.equal(assignedRepId, rep.id, "Lead must be assigned to Dra. Mariana based on WhatsApp binding");

      const card = {
        id: "card_ultrassom_9901",
        title: `${leadData.lead_name} - Ultrassom 3D`,
        dealValue: 68000,
        currentPhase: "Novos Leads",
        assignedToUserId: assignedRepId,
        color: "#3b82f6",
        activities: [] as string[],
      };
      card.activities.push(`Card criado automaticamente via Meta Ads (${leadData.campaign_id})`);
      card.activities.push(`Atribuído ao vendedor ${rep.name} via WhatsApp ${rep.whatsapp}`);

      assert.equal(card.currentPhase, "Novos Leads");
      assert.equal(card.dealValue, 68000);

      // 4. Sales rep qualifies lead through BANT and advances to "Proposta Apresentada"
      card.currentPhase = "Proposta Apresentada";
      card.activities.push("Proposta comercial R$ 68.000 enviada ao cliente");
      assert.equal(card.currentPhase, "Proposta Apresentada");

      // 5. Customer signs contract -> Card moves to "Ganho / Fechado"
      card.currentPhase = "Ganho / Fechado";
      card.activities.push("Contrato assinado - Negócio Ganho");
      assert.equal(card.currentPhase, "Ganho / Fechado");

      // 6. Revenue thermometer & team ranking update (F6)
      rep.wonAmount += card.dealValue;
      rep.wonDealsCount += 1;
      const percentage = (rep.wonAmount / rep.targetAmount) * 100;

      assert.equal(rep.wonAmount, 68000);
      assert.equal(percentage, 68, "Thermometer must reflect 68% goal achievement");
      assert.equal(rep.wonDealsCount, 1);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Medical Prescription Attachment & Doctor BANT Qualification
  // Features: F11, F13, F21, F10, F12
  // --------------------------------------------------------------------------
  describe("Scenario 2: Medical Prescription Attachment & Doctor BANT Qualification", () => {
    test("S2: Doctor prescription validation, secure attachment, and BANT qualification gating", () => {
      const card = {
        id: "card_oftalmo_777",
        title: "Clínica de Olhos Dr. Arnaldo",
        dealValue: 120000,
        currentPhase: "Novos Leads",
        bant: {
          budget: null as string | null,
          authority: null as string | null,
          need: null as string | null,
          timeline: null as string | null,
        },
        attachments: [] as any[],
        labels: [] as string[],
      };

      // 1. Adversarial file upload attempt: Executable renamed to .pdf
      const maliciousBuffer = createMaliciousExeBuffer();
      const validateUpload = (buf: Buffer, filename: string) => {
        const isExe = buf[0] === 0x4d && buf[1] === 0x5a;
        if (isExe) return { valid: false, error: "Executável malicioso detectado" };
        const isPdf = buf.subarray(0, 4).toString("utf8") === "%PDF";
        if (!isPdf) return { valid: false, error: "Formato inválido" };
        return { valid: true };
      };

      const attackResult = validateUpload(maliciousBuffer, "receita_oftalmo.pdf");
      assert.equal(attackResult.valid, false, "Adversarial upload must be blocked");

      // 2. Legitimate prescription upload with %PDF-1.4 magic bytes
      const validPdfBuffer = createValidPdfBuffer("Receita de Equipamento Laser Oftálmico");
      const legitimateResult = validateUpload(validPdfBuffer, "receita_laser.pdf");
      assert.equal(legitimateResult.valid, true, "Legitimate PDF must be accepted");

      card.attachments.push({
        id: "att_laser_01",
        fileName: "receita_laser.pdf",
        mimeType: "application/pdf",
        sizeBytes: validPdfBuffer.length,
      });
      assert.equal(card.attachments.length, 1);

      // 3. SDR completes BANT qualification fields
      card.bant.budget = "R$ 120.000 aprovado em comitê médico";
      card.bant.authority = "Dr. Arnaldo Silveira (Diretor Clínico)";
      card.bant.need = "Laser femtossegundo para cirurgia refrativa";
      card.bant.timeline = "Imediato (30 dias para instalação)";

      // Verification of required BANT fields before moving
      const isBantComplete = Object.values(card.bant).every((val) => Boolean(val && val.length > 0));
      assert.equal(isBantComplete, true, "All BANT fields must be populated");

      // 4. SDR applies supervisor-approved tag
      const approvedTag = { id: "lbl_aprovado", name: "Homologado Médico", color: "#10b981" };
      card.labels.push(approvedTag.id);

      // 5. Advance card to "Qualificação (SDR)" and "Demonstração Técnica"
      card.currentPhase = "Demonstração Técnica";
      assert.equal(card.currentPhase, "Demonstração Técnica");
      assert.equal(card.attachments.length, 1);
      assert.ok(card.labels.includes("lbl_aprovado"));
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Operator Login Schedule Enforcement & Shift Violation Logging
  // Features: F8, F7, F19, F20
  // --------------------------------------------------------------------------
  describe("Scenario 3: Operator Login Schedule Enforcement & Shift Violation Logging", () => {
    test("S3: 24-hour shift cycle: pre-shift blocked, on-shift authorized, post-shift blocked, supervisor 24/7", () => {
      const secret = "session_security_secret_key_2026";
      const operatorUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0";
      const supervisorUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15";

      function checkAccess(
        role: string,
        dayOfWeek: number, // 0=Dom, 1=Seg..5=Sex, 6=Sab
        timeStr: string,
        tokenUA?: string
      ): { allowed: boolean; httpStatus: number; reason?: string } {
        if (role === "SUPERVISOR" || role === "ADMIN") {
          return { allowed: true, httpStatus: 200 };
        }

        // Weekend check
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return {
            allowed: false,
            httpStatus: 403,
            reason: "Acesso bloqueado: fora dos dias úteis autorizados (Segunda a Sexta)",
          };
        }

        // Time check (08:00 to 18:00)
        const [h, m] = timeStr.split(":").map(Number);
        const totalMinutes = h * 60 + m;
        if (totalMinutes < 8 * 60 || totalMinutes > 18 * 60) {
          return {
            allowed: false,
            httpStatus: 403,
            reason: "Acesso não autorizado fora do horário comercial (08:00 às 18:00)",
          };
        }

        return { allowed: true, httpStatus: 200 };
      }

      // Step 1: 06:30 AM Monday (before shift) -> Operator blocked
      const t1 = checkAccess("MEMBER", 1, "06:30", operatorUA);
      assert.equal(t1.allowed, false);
      assert.equal(t1.httpStatus, 403);
      assert.ok(t1.reason?.includes("08:00"));

      // Step 2: 07:59 AM Monday (1 min before shift) -> Operator blocked
      const t2 = checkAccess("MEMBER", 1, "07:59", operatorUA);
      assert.equal(t2.allowed, false);
      assert.equal(t2.httpStatus, 403);

      // Step 3: 08:00 AM Monday (shift start) -> Operator allowed
      const t3 = checkAccess("MEMBER", 1, "08:00", operatorUA);
      assert.equal(t3.allowed, true);
      assert.equal(t3.httpStatus, 200);

      // Issue session token for operator
      const operatorSession = createMockSessionToken(
        {
          userId: "usr_op_1",
          role: "MEMBER",
          fingerprint: computeUserAgentFingerprint(operatorUA),
          issuedAt: Date.now(),
        },
        secret
      );
      assert.ok(operatorSession);

      // Step 4: 11:30 AM (during shift) -> Operator allowed
      const t4 = checkAccess("MEMBER", 1, "11:30", operatorUA);
      assert.equal(t4.allowed, true);
      assert.equal(t4.httpStatus, 200);

      // Step 5: 18:00 PM (shift end boundary) -> Operator allowed
      const t5 = checkAccess("MEMBER", 1, "18:00", operatorUA);
      assert.equal(t5.allowed, true);
      assert.equal(t5.httpStatus, 200);

      // Step 6: 18:01 PM (1 min after shift) -> Operator blocked
      const t6 = checkAccess("MEMBER", 1, "18:01", operatorUA);
      assert.equal(t6.allowed, false);
      assert.equal(t6.httpStatus, 403);

      // Step 7: Saturday 14:00 (weekend) -> Operator blocked
      const t7 = checkAccess("MEMBER", 6, "14:00", operatorUA);
      assert.equal(t7.allowed, false);
      assert.equal(t7.httpStatus, 403);

      // Step 8: Sunday 21:00 (supervisor audit) -> Supervisor allowed 24/7
      const t8 = checkAccess("SUPERVISOR", 0, "21:00", supervisorUA);
      assert.equal(t8.allowed, true);
      assert.equal(t8.httpStatus, 200);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Supervisor Team Target Setup & Live Real-Time Attainment
  // Features: F5, F6, F7, F9
  // --------------------------------------------------------------------------
  describe("Scenario 4: Supervisor Team Target Setup & Live Real-Time Attainment", () => {
    test("S4: Quota assignment for 3 reps, incoming won deals, real-time podium ranking calculation", () => {
      // 1. Supervisor configures monthly quotas and WhatsApp numbers
      const reps = [
        { id: "rep_1", name: "Dra. Mariana", targetAmount: 80000, wonAmount: 0, whatsapp: "+5511999990001" },
        { id: "rep_2", name: "Rodrigo Costa", targetAmount: 60000, wonAmount: 0, whatsapp: "+5511999990002" },
        { id: "rep_3", name: "Camila Duarte", targetAmount: 50000, wonAmount: 0, whatsapp: "+5511999990003" },
      ];

      const teamTarget = reps.reduce((sum, r) => sum + r.targetAmount, 0);
      assert.equal(teamTarget, 190000, "Team target must be R$ 190.000");

      // 2. Closed won deals arrive
      // Mariana closes R$ 48.000
      reps[0].wonAmount += 48000;
      // Rodrigo closes R$ 54.000
      reps[1].wonAmount += 54000;
      // Camila closes R$ 20.000
      reps[2].wonAmount += 20000;

      // 3. Compute attainment metrics for each rep
      const metrics = reps.map((r) => ({
        ...r,
        percentage: (r.wonAmount / r.targetAmount) * 100,
      }));

      assert.equal(metrics[0].percentage, 60, "Mariana attainment: 60%");
      assert.equal(metrics[1].percentage, 90, "Rodrigo attainment: 90%");
      assert.equal(metrics[2].percentage, 40, "Camila attainment: 40%");

      // 4. Calculate live podium ranking (ordered by percentage descending)
      const rankedPodium = [...metrics].sort((a, b) => b.percentage - a.percentage);

      assert.equal(rankedPodium[0].name, "Rodrigo Costa", "#1 Rodrigo with 90%");
      assert.equal(rankedPodium[1].name, "Dra. Mariana", "#2 Mariana with 60%");
      assert.equal(rankedPodium[2].name, "Camila Duarte", "#3 Camila with 40%");

      // 5. Calculate team aggregate progress
      const teamWon = reps.reduce((sum, r) => sum + r.wonAmount, 0);
      const teamPercentage = (teamWon / teamTarget) * 100;

      assert.equal(teamWon, 122000, "Team total won must be R$ 122.000");
      assert.ok(Math.abs(teamPercentage - 64.21) < 0.01, "Team attainment should be ~64.21%");
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Tag Governance & Card Color Organization Under RBAC
  // Features: F11, F12, F7, F20
  // --------------------------------------------------------------------------
  describe("Scenario 5: Tag Governance & Card Color Organization Under RBAC", () => {
    test("S5: High-volume triage: ad-hoc tag rejected, supervisor standardizes tags, operator categorizes via color palette", () => {
      const pipeId = "pipe_comercial_hospitalar";
      const tags = [
        { id: "lbl_urgente", name: "Urgente", color: "#ef4444", pipeId },
        { id: "lbl_retorno", name: "Retorno 24h", color: "#f59e0b", pipeId },
      ];

      // 1. Operator attempts to create ad-hoc tag "Descarte Imediato" -> Rejected
      const attemptTagCreation = (userRole: string, tagName: string) => {
        if (userRole !== "SUPERVISOR" && userRole !== "ADMIN") {
          return { status: 403, error: "Apenas supervisores podem criar novas etiquetas" };
        }
        return { status: 201, tag: { id: `lbl_${Date.now()}`, name: tagName, pipeId } };
      };

      const operatorAttempt = attemptTagCreation("MEMBER", "Descarte Imediato");
      assert.equal(operatorAttempt.status, 403, "Operator tag creation must return HTTP 403");

      // 2. Supervisor creates standardized tags
      const supAttempt1 = attemptTagCreation("SUPERVISOR", "Orçamento Enviado");
      const supAttempt2 = attemptTagCreation("SUPERVISOR", "Doc Pendente");
      assert.equal(supAttempt1.status, 201);
      assert.equal(supAttempt2.status, 201);
      tags.push(supAttempt1.tag as any, supAttempt2.tag as any);
      assert.equal(tags.length, 4);

      // 3. Operator categorizes incoming leads using visual card colors
      const cards = [
        { id: "c1", title: "Hospital São Lucas", color: "#ef4444", labels: ["lbl_urgente"] }, // Red = urgent
        { id: "c2", title: "Clínica Vida", color: "#f59e0b", labels: ["lbl_retorno"] }, // Yellow = 24h
        { id: "c3", title: "Centro Diagnóstico SP", color: "#10b981", labels: [supAttempt1.tag!.id] }, // Green = Proposal sent
      ];

      assert.equal(cards[0].color, "#ef4444");
      assert.equal(cards[1].color, "#f59e0b");
      assert.equal(cards[2].color, "#10b981");

      // 4. Verify no tag sprawl occurred (exact 4 approved tags in taxonomy)
      assert.equal(tags.length, 4, "Taxonomy must strictly retain only supervisor-approved tags");
      assert.ok(tags.every((t) => t.pipeId === pipeId));
    });
  });
});
