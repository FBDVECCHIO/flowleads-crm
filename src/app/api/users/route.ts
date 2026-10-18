import { prisma } from "../../../lib/prisma.ts";
import { requireAuth } from "../../../lib/auth.ts";
import { persistDatabase, ensureDatabaseReady } from "../../../lib/dbSync.ts";
import { maskPhone } from "../../../lib/utils.ts";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(req: Request) {
  try {
    await ensureDatabaseReady();
    const session = await requireAuth(req);
    
    if (session.role !== "ADMIN" && session.role !== "SUPERVISOR") {
      return Response.json(
        { error: "Acesso restrito para Supervisores e Administradores." },
        { status: 403, headers: noStoreHeaders }
      );
    }

    const orgId = session.organizationId;
    if (!orgId) {
      return Response.json({ error: "Organização não localizada." }, { status: 404, headers: noStoreHeaders });
    }

    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        whatsappNumber: true,
        monthlyTargetAmount: true,
        monthlyTargetDeals: true,
        workingDaysPerMonth: true,
        allowedMenus: true,
        allowedDays: true,
        workStartTime: true,
        workEndTime: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return Response.json(users, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    const status = error.status || error.statusCode || 500;
    return Response.json({ error: error.message || "Erro ao listar usuários." }, { status, headers: noStoreHeaders });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();
    const session = await requireAuth(req);

    if (session.role !== "ADMIN" && session.role !== "SUPERVISOR") {
      return Response.json(
        { error: "Apenas Supervisores ou Administradores podem cadastrar novos usuários." },
        { status: 403, headers: noStoreHeaders }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
      role = "MEMBER",
      whatsappNumber,
      monthlyTargetAmount = 100000,
      monthlyTargetDeals = 10,
      workingDaysPerMonth = 22,
      allowedMenus = "metas,kanban,reports",
      allowedDays = "1,2,3,4,5",
      workStartTime = "08:00",
      workEndTime = "18:00",
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return Response.json({ error: "Nome completo é obrigatório." }, { status: 400, headers: noStoreHeaders });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return Response.json({ error: "Usuário de acesso ou e-mail é obrigatório." }, { status: 400, headers: noStoreHeaders });
    }

    const cleanInput = email.trim().toLowerCase();
    const normalizedEmail = cleanInput.includes("@") ? cleanInput : `${cleanInput}@flowleads.com`;

    if (!password || typeof password !== "string" || password.length < 6) {
      return Response.json({ error: "Senha deve conter no mínimo 6 caracteres." }, { status: 400, headers: noStoreHeaders });
    }

    // Check if user/email already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedEmail, mode: "insensitive" } },
          { email: { equals: cleanInput, mode: "insensitive" } },
          { email: { startsWith: `${cleanInput}@`, mode: "insensitive" } },
        ],
      },
    });
    if (existing) {
      return Response.json({ error: "Já existe um usuário cadastrado com este nome de acesso ou e-mail." }, { status: 409, headers: noStoreHeaders });
    }

    const orgId = session.organizationId;
    if (!orgId) {
      return Response.json({ error: "Organização não localizada na sessão." }, { status: 400, headers: noStoreHeaders });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        organizationId: orgId,
        name: name.trim().toUpperCase(),
        email: normalizedEmail,
        passwordHash,
        role: role.toUpperCase(),
        whatsappNumber: whatsappNumber ? maskPhone(String(whatsappNumber).trim()) : null,
        monthlyTargetAmount: Number(monthlyTargetAmount) || 100000,
        monthlyTargetDeals: Number(monthlyTargetDeals) || 10,
        workingDaysPerMonth: Number(workingDaysPerMonth) || 22,
        allowedMenus: allowedMenus ? String(allowedMenus).trim() : "metas,kanban,reports",
        allowedDays: allowedDays ? String(allowedDays).trim() : "1,2,3,4,5",
        workStartTime: workStartTime || "08:00",
        workEndTime: workEndTime || "18:00",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        whatsappNumber: true,
        monthlyTargetAmount: true,
        monthlyTargetDeals: true,
        workingDaysPerMonth: true,
        allowedMenus: true,
        allowedDays: true,
        workStartTime: true,
        workEndTime: true,
        createdAt: true,
      },
    });

    await persistDatabase();
    return Response.json(newUser, { status: 201, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message || "Erro ao criar usuário." }, { status: 500, headers: noStoreHeaders });
  }
}

