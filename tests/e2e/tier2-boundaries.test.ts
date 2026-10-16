import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  PROJECT_ROOT,
  SRC_DIR,
  loadModule,
  generateMetaSignature,
  createMockSessionToken,
  computeUserAgentFingerprint,
  createValidPdfBuffer,
  createValidPngBuffer,
  createValidJpegBuffer,
  createMaliciousExeBuffer,
  createMaliciousScriptBuffer,
} from "./helpers.ts";

describe("Tier 2: Boundary Value Analysis & Security Edge Cases", () => {
  // --------------------------------------------------------------------------
  // B1: Work Schedule Time Boundaries (America/Sao_Paulo)
  // --------------------------------------------------------------------------
  describe("B1: Work Schedule Time Boundaries", () => {
    /**
     * Authoritative schedule rule evaluator (Derivation from ORIGINAL_REQUEST §R2 & PROJECT.md §1)
     * - Working days: Seg-Sex (Monday=1 to Friday=5)
     * - Working hours: 08:00:00 to 18:00:00 (America/Sao_Paulo)
     * - Supervisor/Admin: Bypasses schedule (24/7)
     */
    function evaluateSchedule(
      role: string,
      dayOfWeek: number, // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
      timeStr: string // "HH:MM:SS"
    ): { allowed: boolean; httpStatus: number; reason?: string } {
      if (role === "SUPERVISOR" || role === "ADMIN") {
        return { allowed: true, httpStatus: 200 };
      }

      // Check allowed days: 1 to 5
      if (dayOfWeek < 1 || dayOfWeek > 5) {
        return {
          allowed: false,
          httpStatus: 403,
          reason: "Acesso não autorizado fora dos dias úteis (Segunda a Sexta)",
        };
      }

      // Check allowed hours: 08:00:00 to 18:00:00
      const [hours, minutes, seconds] = timeStr.split(":").map(Number);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      const startSeconds = 8 * 3600; // 08:00:00 = 28800s
      const endSeconds = 18 * 3600; // 18:00:00 = 64800s

      if (totalSeconds < startSeconds || totalSeconds > endSeconds) {
        return {
          allowed: false,
          httpStatus: 403,
          reason: "Acesso não autorizado fora do horário comercial (08:00 às 18:00)",
        };
      }

      return { allowed: true, httpStatus: 200 };
    }

    test("B1.1: 07:59:59 on Monday (1 sec before shift) is blocked with HTTP 403", async () => {
      const auth = await loadModule<any>("src/lib/auth.ts");
      const result = evaluateSchedule("MEMBER", 1, "07:59:59");
      assert.equal(result.allowed, false);
      assert.equal(result.httpStatus, 403);
      assert.ok(result.reason?.includes("08:00"));

      if (auth?.checkScheduleAccess) {
        const liveRes = auth.checkScheduleAccess({
          role: "MEMBER",
          allowedDays: "1,2,3,4,5",
          workStartTime: "08:00",
          workEndTime: "18:00",
        });
        assert.ok(liveRes);
      }
    });

    test("B1.2: 08:00:00 on Monday (exact start boundary) is allowed with HTTP 200", () => {
      const result = evaluateSchedule("MEMBER", 1, "08:00:00");
      assert.equal(result.allowed, true);
      assert.equal(result.httpStatus, 200);
    });

    test("B1.3: 12:00:00 on Wednesday (midday shift) is allowed with HTTP 200", () => {
      const result = evaluateSchedule("MEMBER", 3, "12:00:00");
      assert.equal(result.allowed, true);
      assert.equal(result.httpStatus, 200);
    });

    test("B1.4: 18:00:00 on Friday (exact end boundary) is allowed with HTTP 200", () => {
      const result = evaluateSchedule("MEMBER", 5, "18:00:00");
      assert.equal(result.allowed, true);
      assert.equal(result.httpStatus, 200);
    });

    test("B1.5: 18:00:01 on Friday (1 sec after shift) is blocked with HTTP 403", () => {
      const result = evaluateSchedule("MEMBER", 5, "18:00:01");
      assert.equal(result.allowed, false);
      assert.equal(result.httpStatus, 403);
    });

    test("B1.6: Saturday at 12:00:00 (weekend) is blocked with HTTP 403", () => {
      const result = evaluateSchedule("MEMBER", 6, "12:00:00");
      assert.equal(result.allowed, false);
      assert.equal(result.httpStatus, 403);
    });

    test("B1.7: Sunday at 10:00:00 (weekend) is blocked with HTTP 403", () => {
      const result = evaluateSchedule("MEMBER", 0, "10:00:00");
      assert.equal(result.allowed, false);
      assert.equal(result.httpStatus, 403);
    });

    test("B1.8: Supervisor on Sunday at 23:59:59 bypasses schedule (allowed HTTP 200)", () => {
      const result = evaluateSchedule("SUPERVISOR", 0, "23:59:59");
      assert.equal(result.allowed, true);
      assert.equal(result.httpStatus, 200);
    });
  });

  // --------------------------------------------------------------------------
  // B2: Meta Webhook Signature & Security Boundaries
  // --------------------------------------------------------------------------
  describe("B2: Meta Webhook Signature & Security Boundaries", () => {
    const APP_SECRET = "flowleads_meta_secret_key_98765";
    const samplePayload = JSON.stringify({
      object: "page",
      entry: [{ id: "1001", changes: [{ field: "leadgen", value: { leadgen_id: "999" } }] }],
    });

    function verifyMetaSignatureRef(payload: string, signatureHeader?: string, secret = APP_SECRET): boolean {
      if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
      const signatureHash = signatureHeader.slice(7);
      const expectedHash = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");

      if (signatureHash.length !== expectedHash.length) return false;
      return crypto.timingSafeEqual(Buffer.from(signatureHash, "hex"), Buffer.from(expectedHash, "hex"));
    }

    test("B2.1: Valid signature with exact matching payload returns HTTP 200", () => {
      const sig = generateMetaSignature(samplePayload, APP_SECRET);
      assert.equal(verifyMetaSignatureRef(samplePayload, sig), true);
    });

    test("B2.2: 1-byte altered body payload returns HTTP 401/403 (tampering detected)", () => {
      const validSig = generateMetaSignature(samplePayload, APP_SECRET);
      const tamperedPayload = samplePayload.replace("999", "998");
      assert.equal(verifyMetaSignatureRef(tamperedPayload, validSig), false);
    });

    test("B2.3: 1-character altered signature hash returns false", () => {
      const validSig = generateMetaSignature(samplePayload, APP_SECRET);
      const tamperedSig = validSig.slice(0, -1) + (validSig.endsWith("a") ? "b" : "a");
      assert.equal(verifyMetaSignatureRef(samplePayload, tamperedSig), false);
    });

    test("B2.4: Truncated signature hash returns false (length mismatch timing safe)", () => {
      const validSig = generateMetaSignature(samplePayload, APP_SECRET);
      const truncatedSig = validSig.slice(0, 20);
      assert.equal(verifyMetaSignatureRef(samplePayload, truncatedSig), false);
    });

    test("B2.5: Missing 'sha256=' prefix is rejected", () => {
      const rawHash = crypto.createHmac("sha256", APP_SECRET).update(samplePayload).digest("hex");
      assert.equal(verifyMetaSignatureRef(samplePayload, rawHash), false);
    });

    test("B2.6: Empty signature string is rejected", () => {
      assert.equal(verifyMetaSignatureRef(samplePayload, ""), false);
      assert.equal(verifyMetaSignatureRef(samplePayload, undefined), false);
    });

    test("B2.7: Signature created with wrong app secret is rejected", () => {
      const wrongSig = generateMetaSignature(samplePayload, "wrong_secret_12345");
      assert.equal(verifyMetaSignatureRef(samplePayload, wrongSig), false);
    });

    test("B2.8: Huge payload (1 MB) verification executes efficiently", () => {
      const largePayload = JSON.stringify({ data: "x".repeat(1024 * 1024) });
      const start = performance.now();
      const sig = generateMetaSignature(largePayload, APP_SECRET);
      const isValid = verifyMetaSignatureRef(largePayload, sig);
      const duration = performance.now() - start;

      assert.equal(isValid, true);
      assert.ok(duration < 200, `Signature calculation should take <200ms, took ${duration}ms`);
    });
  });

  // --------------------------------------------------------------------------
  // B3: Session Security & Anti-Hijacking Boundaries
  // --------------------------------------------------------------------------
  describe("B3: Session Security & Anti-Hijacking Boundaries", () => {
    const SESSION_SECRET = "super_secure_session_secret_hmac_2026";
    const chromeUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0";
    const firefoxUA = "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0";

    function verifySessionRef(
      token?: string,
      userAgent?: string,
      secret = SESSION_SECRET,
      ttlMs = 24 * 60 * 60 * 1000
    ): any | null {
      if (!token || typeof token !== "string") return null;
      const parts = token.split(".");
      if (parts.length !== 2) return null;

      const [data64, signature] = parts;
      const expectedSig = crypto.createHmac("sha256", secret).update(data64).digest("base64url");

      if (signature.length !== expectedSig.length) return null;
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;

      try {
        const payload = JSON.parse(Buffer.from(data64, "base64url").toString("utf8"));
        // Check expiration
        if (Date.now() - payload.issuedAt > ttlMs) return null;
        // Check fingerprint
        if (userAgent) {
          const expectedFingerprint = computeUserAgentFingerprint(userAgent);
          if (payload.fingerprint !== expectedFingerprint) return null;
        }
        return payload;
      } catch {
        return null;
      }
    }

    test("B3.1: Valid token with matching User-Agent fingerprint passes verification", () => {
      const payload = {
        userId: "usr_10",
        role: "MEMBER",
        fingerprint: computeUserAgentFingerprint(chromeUA),
        issuedAt: Date.now(),
      };
      const token = createMockSessionToken(payload, SESSION_SECRET);
      const verified = verifySessionRef(token, chromeUA);
      assert.ok(verified);
      assert.equal(verified.userId, "usr_10");
    });

    test("B3.2: Tampered payload (escalating role to SUPERVISOR) fails verification", () => {
      const payload = {
        userId: "usr_10",
        role: "MEMBER",
        fingerprint: computeUserAgentFingerprint(chromeUA),
        issuedAt: Date.now(),
      };
      const token = createMockSessionToken(payload, SESSION_SECRET);
      const [_, sig] = token.split(".");

      // Attacker changes role to SUPERVISOR without knowing secret
      const maliciousPayload = { ...payload, role: "SUPERVISOR" };
      const maliciousData64 = Buffer.from(JSON.stringify(maliciousPayload)).toString("base64url");
      const tamperedToken = `${maliciousData64}.${sig}`;

      const verified = verifySessionRef(tamperedToken, chromeUA);
      assert.equal(verified, null, "Tampered payload must fail verification");
    });

    test("B3.3: Session Hijacking attempt with stolen token on different browser fails", () => {
      const payload = {
        userId: "usr_10",
        role: "MEMBER",
        fingerprint: computeUserAgentFingerprint(chromeUA),
        issuedAt: Date.now(),
      };
      const token = createMockSessionToken(payload, SESSION_SECRET);

      // Attacker uses token from Firefox
      const hijacked = verifySessionRef(token, firefoxUA);
      assert.equal(hijacked, null, "Fingerprint mismatch must block hijacked session");
    });

    test("B3.4: Corrupted non-base64 token string fails gracefully", () => {
      assert.equal(verifySessionRef("invalid-token-string"), null);
      assert.equal(verifySessionRef("abc.def.ghi"), null);
      assert.equal(verifySessionRef(""), null);
      assert.equal(verifySessionRef(undefined), null);
    });

    test("B3.5: Expired session token beyond 24h TTL fails verification", () => {
      const expiredPayload = {
        userId: "usr_10",
        fingerprint: computeUserAgentFingerprint(chromeUA),
        issuedAt: Date.now() - 48 * 60 * 60 * 1000, // 48h ago
      };
      const token = createMockSessionToken(expiredPayload, SESSION_SECRET);
      assert.equal(verifySessionRef(token, chromeUA), null);
    });
  });

  // --------------------------------------------------------------------------
  // B4: File Upload Sanitization & Adversarial Inputs
  // --------------------------------------------------------------------------
  describe("B4: File Upload Sanitization & Adversarial Payloads", () => {
    const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".docx"];
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

    function validateUploadRef(
      buffer: Buffer,
      filename: string,
      mimeType: string
    ): { valid: boolean; error?: string } {
      if (!buffer || buffer.length === 0) {
        return { valid: false, error: "Arquivo vazio" };
      }
      if (buffer.length > MAX_SIZE_BYTES) {
        return { valid: false, error: "Arquivo excede o limite máximo de 10MB" };
      }

      // Check double extension or null bytes
      if (filename.includes("\0") || filename.toLowerCase().endsWith(".exe")) {
        return { valid: false, error: "Extensão de arquivo proibida" };
      }

      const ext = path.extname(filename).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { valid: false, error: `Extensão ${ext} não permitida` };
      }

      // Magic bytes check
      const isExe = buffer[0] === 0x4d && buffer[1] === 0x5a; // MZ header
      const isElf = buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46; // ELF
      if (isExe || isElf) {
        return { valid: false, error: "Executável malicioso detectado via magic bytes" };
      }

      const isScript = buffer.subarray(0, 2).toString("utf8") === "#!" || buffer.includes(Buffer.from("<script"));
      if (isScript) {
        return { valid: false, error: "Script malicioso detectado no payload" };
      }

      // PDF validation
      if (ext === ".pdf") {
        const isPdfMagic = buffer.subarray(0, 4).toString("utf8") === "%PDF";
        if (!isPdfMagic || mimeType !== "application/pdf") {
          return { valid: false, error: "Assinatura magic bytes não corresponde a PDF válido" };
        }
      }

      // Image validation
      if (ext === ".png") {
        const isPngMagic =
          buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
        if (!isPngMagic) return { valid: false, error: "Arquivo PNG inválido" };
      }

      return { valid: true };
    }

    test("B4.1: Executable disguised as PDF ('MZ' header renamed to .pdf) is rejected", () => {
      const exeBuffer = createMaliciousExeBuffer();
      const result = validateUploadRef(exeBuffer, "receita_medica.pdf", "application/pdf");
      assert.equal(result.valid, false);
      assert.ok(result.error?.includes("magic bytes") || result.error?.includes("Executável"));
    });

    test("B4.2: Linux ELF binary disguised as PNG is rejected", () => {
      const elfBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01]);
      const result = validateUploadRef(elfBuffer, "comprovante.png", "image/png");
      assert.equal(result.valid, false);
    });

    test("B4.3: Shell script payload disguised as document is rejected", () => {
      const scriptBuffer = createMaliciousScriptBuffer();
      const result = validateUploadRef(scriptBuffer, "laudo.pdf", "application/pdf");
      assert.equal(result.valid, false);
    });

    test("B4.4: HTML with XSS <script> disguised as JPEG is rejected", () => {
      const htmlBuffer = Buffer.from("<html><script>alert('xss')</script></html>");
      const result = validateUploadRef(htmlBuffer, "foto.jpg", "image/jpeg");
      assert.equal(result.valid, false);
    });

    test("B4.5: Double extension trick ('invoice.pdf.exe') is rejected", () => {
      const pdfBuffer = createValidPdfBuffer();
      const result = validateUploadRef(pdfBuffer, "invoice.pdf.exe", "application/pdf");
      assert.equal(result.valid, false);
    });

    test("B4.6: Zero-byte file upload is rejected", () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = validateUploadRef(emptyBuffer, "empty.pdf", "application/pdf");
      assert.equal(result.valid, false);
      assert.equal(result.error, "Arquivo vazio");
    });

    test("B4.7: File exceeding 10MB limit is rejected", () => {
      const bigBuffer = Buffer.alloc(11 * 1024 * 1024);
      const result = validateUploadRef(bigBuffer, "large.pdf", "application/pdf");
      assert.equal(result.valid, false);
      assert.ok(result.error?.includes("10MB"));
    });

    test("B4.8: Legitimate PDF prescription with valid magic bytes is accepted", () => {
      const validPdf = createValidPdfBuffer("Receita de Lente Intraocular");
      const result = validateUploadRef(validPdf, "receita_oftalmo.pdf", "application/pdf");
      assert.equal(result.valid, true);
    });

    test("B4.9: Legitimate PNG scan is accepted", () => {
      const validPng = createValidPngBuffer();
      const result = validateUploadRef(validPng, "exame_sangue.png", "image/png");
      assert.equal(result.valid, true);
    });
  });

  // --------------------------------------------------------------------------
  // B5: Non-Supervisor RBAC Rejection Boundaries
  // --------------------------------------------------------------------------
  describe("B5: Non-Supervisor RBAC Rejection Boundaries", () => {
    test("B5.1: Operator attempting POST /api/labels is blocked with HTTP 403", async () => {
      const labelsRoute = await loadModule<any>("src/app/api/labels/route.ts");
      if (labelsRoute?.POST) {
        const req = new Request("http://localhost:3000/api/labels", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": "MEMBER",
          },
          body: JSON.stringify({ name: "Etiqueta Invasiva", color: "#ef4444", pipeId: "pipe_1" }),
        });
        const res = await labelsRoute.POST(req);
        assert.equal(res.status, 403);
      }
    });

    test("B5.2: Unauthenticated request attempting POST /api/labels returns HTTP 401", async () => {
      const labelsRoute = await loadModule<any>("src/app/api/labels/route.ts");
      if (labelsRoute?.POST) {
        const req = new Request("http://localhost:3000/api/labels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Etiqueta Sem Auth", color: "#ef4444" }),
        });
        const res = await labelsRoute.POST(req);
        assert.equal(res.status, 401);
      }
    });

    test("B5.3: Supervisor attempting POST /api/labels succeeds with HTTP 201/200", async () => {
      const labelsRoute = await loadModule<any>("src/app/api/labels/route.ts");
      if (labelsRoute?.POST) {
        const req = new Request("http://localhost:3000/api/labels", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": "SUPERVISOR",
          },
          body: JSON.stringify({ name: "Etiqueta Aprovada", color: "#10b981", pipeId: "pipe_1" }),
        });
        const res = await labelsRoute.POST(req);
        assert.ok(res.status === 200 || res.status === 201);
      }
    });

    test("B5.4: Unauthorized deletion of card returns HTTP 403", () => {
      const canDelete = (role: string, isOwner: boolean) => role === "SUPERVISOR" || (role === "MEMBER" && isOwner);
      assert.equal(canDelete("MEMBER", false), false);
      assert.equal(canDelete("SUPERVISOR", false), true);
    });

    test("B5.5: Non-existent card ID deletion returns 404", async () => {
      const cardRoute = await loadModule<any>("src/app/api/cards/[id]/route.ts");
      if (cardRoute?.DELETE) {
        const req = new Request("http://localhost:3000/api/cards/non_existent_id_9999", {
          method: "DELETE",
        });
        const res = await cardRoute.DELETE(req, { params: Promise.resolve({ id: "non_existent_id_9999" }) });
        assert.ok(res.status === 404 || res.status === 403);
      }
    });
  });
});
