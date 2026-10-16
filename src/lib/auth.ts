import { prisma } from "./prisma.ts";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  whatsappNumber?: string | null;
  monthlyTargetAmount?: number | null;
  monthlyTargetDeals?: number | null;
  allowedDays?: string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "SUPERVISOR" | "MEMBER";
  organizationId: string;
  fingerprint: string;
  issuedAt: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET || "flowleads_secure_hmac_secret_2026";

/**
 * SHA-256 fingerprint of User-Agent to prevent session hijacking
 */
export function computeUserAgentFingerprint(userAgent: string): string {
  return crypto.createHash("sha256").update(userAgent || "").digest("hex");
}

/**
 * Stateless HMAC-SHA256 session token signer
 */
export function signSession(payload: SessionPayload, secret = SESSION_SECRET): string {
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
  secret = SESSION_SECRET,
  ttlMs = 24 * 60 * 60 * 1000
): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data64, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", secret).update(data64).digest("base64url");

  if (signature.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;

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

/**
 * Helper to extract time parts in America/Sao_Paulo timezone
 */
function getSaoPauloTimeParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekdayMap[map.weekday] ?? 0;
  let hour = parseInt(map.hour || "0", 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(map.minute || "0", 10);
  const second = parseInt(map.second || "0", 10);
  return { day, hour, minute, second };
}

/**
 * Access control based on authorized work schedule (Seg-Sex 08:00 às 18:00 America/Sao_Paulo)
 * Operators (MEMBER) outside business hours are blocked with HTTP 403.
 * Supervisors and Admins bypass schedule restrictions 24/7.
 */
export function checkScheduleAccess(
  user: {
    role: string;
    allowedDays?: string | null;
    workStartTime?: string | null;
    workEndTime?: string | null;
  },
  now: Date = new Date()
): { allowed: boolean; reason?: string } {
  if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
    return { allowed: true };
  }

  const allowedDaysStr = user.allowedDays ?? "1,2,3,4,5";
  const allowedDays = allowedDaysStr
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((n) => !isNaN(n));

  const startTime = user.workStartTime || "08:00";
  const endTime = user.workEndTime || "18:00";

  const { day, hour, minute, second } = getSaoPauloTimeParts(now);
  const currentTotalSeconds = hour * 3600 + minute * 60 + second;

  const [startH, startM = 0, startS = 0] = startTime.split(":").map(Number);
  const startTotalSeconds = startH * 3600 + startM * 60 + startS;

  const [endH, endM = 0, endS = 0] = endTime.split(":").map(Number);
  const endTotalSeconds = endH * 3600 + endM * 60 + endS;

  const dayNames = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];

  if (!allowedDays.includes(day)) {
    return {
      allowed: false,
      reason: `Acesso fora da jornada de trabalho autorizada (${dayNames[day] || "Fim de semana"}). Seu expediente é de Segunda a Sexta (${startTime} às ${endTime}). Contate seu supervisor.`,
    };
  }

  if (currentTotalSeconds < startTotalSeconds || currentTotalSeconds > endTotalSeconds) {
    const formattedHour = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    return {
      allowed: false,
      reason: `Acesso fora da jornada de trabalho autorizada (${formattedHour} - jornada permitida de ${startTime} às ${endTime}). Contate seu supervisor.`,
    };
  }

  return { allowed: true };
}

/**
 * Route handler RBAC guard
 */
export async function requireAuth(req: Request, allowedRoles?: string[]): Promise<SessionPayload> {
  const cookieHeader = req.headers.get("cookie") || "";
  let token: string | null = null;
  const match = cookieHeader.match(/flowleads_session=([^;]+)/);
  if (match) {
    token = decodeURIComponent(match[1]);
  } else {
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  const userAgent = req.headers.get("user-agent") || undefined;
  const session = token ? verifySession(token, userAgent) : null;

  if (!session) {
    const err: any = new Error("Sessão expirada ou não autenticada.");
    err.status = 401;
    throw err;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    const err: any = new Error("Acesso não autorizado para o seu perfil.");
    err.status = 403;
    throw err;
  }

  return session;
}

export async function authenticateUser(email: string, passwordPlain: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user) return null;

  const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!isValid) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    whatsappNumber: user.whatsappNumber,
    monthlyTargetAmount: user.monthlyTargetAmount,
    monthlyTargetDeals: user.monthlyTargetDeals,
    allowedDays: user.allowedDays,
    workStartTime: user.workStartTime,
    workEndTime: user.workEndTime,
  };
}

export async function getDefaultUser(): Promise<SessionUser> {
  const user = await prisma.user.findFirst({
    include: { organization: true },
  });
  if (!user) throw new Error("No default user found in database");
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    whatsappNumber: user.whatsappNumber,
    monthlyTargetAmount: user.monthlyTargetAmount,
    monthlyTargetDeals: user.monthlyTargetDeals,
    allowedDays: user.allowedDays,
    workStartTime: user.workStartTime,
    workEndTime: user.workEndTime,
  };
}