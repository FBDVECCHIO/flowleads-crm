import crypto from "crypto";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "SUPERVISOR" | "MEMBER";
  organizationId: string;
  fingerprint: string;
  issuedAt: number;
}

const EPHEMERAL_RUNTIME_SECRET = crypto.randomBytes(32).toString("hex");

export function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16) {
    return process.env.SESSION_SECRET.trim();
  }
  return EPHEMERAL_RUNTIME_SECRET;
}

/**
 * SHA-256 fingerprint of User-Agent to prevent session hijacking
 */
export function computeUserAgentFingerprint(userAgent: string): string {
  return crypto.createHash("sha256").update(userAgent || "").digest("hex");
}

/**
 * Stateless HMAC-SHA256 session token signer
 */
export function signSession(payload: SessionPayload, secret = getSessionSecret()): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/**
 * Verify and parse HMAC-SHA256 session token with timing-safe check & User-Agent fingerprint defense
 */
export function verifySession(
  token: string,
  userAgent?: string,
  secret = getSessionSecret(),
  ttlMs = 24 * 60 * 60 * 1000
): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data64, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", secret).update(data64).digest("base64url");

  if (signature.length !== expectedSig.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data64, "base64url").toString("utf8")) as SessionPayload;
    if (Date.now() - payload.issuedAt > ttlMs) return null;
    if (userAgent) {
      const expectedFingerprint = computeUserAgentFingerprint(userAgent);
      if (payload.fingerprint !== expectedFingerprint) return null;
    }
    return payload;
  } catch {
    return null;
  }
}
