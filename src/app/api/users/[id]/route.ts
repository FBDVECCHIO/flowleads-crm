import { prisma } from "../../../../lib/prisma.ts";
import { requireAuth } from "../../../../lib/auth.ts";
import { persistDatabase, ensureDatabaseReady } from "../../../../lib/dbSync.ts";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await ensureDatabaseReady();
    const resolvedParams = await Promise.resolve(params);
    const session = await requireAuth(req);

    if (session.role !== "ADMIN" && session.role !== "SUPERVISOR") {
      return Response.json({ error: "Acesso restrito a Supervisores." }, { status: 403, headers: noStoreHeaders });
    }

    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
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

    if (!user) {
      return Response.json({ error: "Usuário não encontrado." }, { status: 404, headers: noStoreHeaders });
    }

    if (session.organizationId && user.organizationId !== session.organizationId) {
      return Response.json({ error: "Acesso não autorizado a este usuário." }, { status: 403, headers: noStoreHeaders });
    }

    return Response.json(user, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    const status = error.status || error.statusCode || 500;
    return Response.json({ error: error.message }, { status, headers: noStoreHeaders });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await ensureDatabaseReady();
    const resolvedParams = await Promise.resolve(params);
    const session = await requireAuth(req);

    if (session.role !== "ADMIN" && session.role !== "SUPERVISOR") {
      return Response.json({ error: "Acesso restrito a Supervisores." }, { status: 403, headers: noStoreHeaders });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingUser) {
      return Response.json({ error: "Usuário não encontrado." }, { status: 404, headers: noStoreHeaders });
    }

    if (session.organizationId && existingUser.organizationId !== session.organizationId) {
      return Response.json({ error: "Acesso não autorizado a este usuário." }, { status: 403, headers: noStoreHeaders });
    }

    const body = await req.json();
    const dataToUpdate: any = {};

    if (body.name !== undefined) dataToUpdate.name = String(body.name).trim().toUpperCase();
    if (body.email !== undefined) {
      const raw = String(body.email).trim().toLowerCase();
      dataToUpdate.email = raw.includes("@") ? raw : `${raw}@flowleads.com`;
    }
    if (body.role !== undefined) dataToUpdate.role = String(body.role).toUpperCase();
    if (body.whatsappNumber !== undefined) dataToUpdate.whatsappNumber = body.whatsappNumber ? String(body.whatsappNumber).trim() : null;
    if (body.monthlyTargetAmount !== undefined) dataToUpdate.monthlyTargetAmount = Number(body.monthlyTargetAmount) || 0;
    if (body.monthlyTargetDeals !== undefined) dataToUpdate.monthlyTargetDeals = Number(body.monthlyTargetDeals) || 0;
    if (body.workingDaysPerMonth !== undefined) dataToUpdate.workingDaysPerMonth = Number(body.workingDaysPerMonth) || 22;
    if (body.allowedMenus !== undefined) dataToUpdate.allowedMenus = String(body.allowedMenus).trim();
    if (body.allowedDays !== undefined) dataToUpdate.allowedDays = String(body.allowedDays).trim();
    if (body.workStartTime !== undefined) dataToUpdate.workStartTime = String(body.workStartTime).trim();
    if (body.workEndTime !== undefined) dataToUpdate.workEndTime = String(body.workEndTime).trim();

    if (body.password && typeof body.password === "string" && body.password.length >= 6) {
      dataToUpdate.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate,
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
    return Response.json(updatedUser, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    const status = error.status || error.statusCode || 500;
    return Response.json({ error: error.message || "Erro ao atualizar usuário." }, { status, headers: noStoreHeaders });
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  return PATCH(req, props);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await ensureDatabaseReady();
    const resolvedParams = await Promise.resolve(params);
    const session = await requireAuth(req);

    if (session.role !== "ADMIN" && session.role !== "SUPERVISOR") {
      return Response.json({ error: "Acesso restrito a Supervisores." }, { status: 403, headers: noStoreHeaders });
    }

    if (session.userId === resolvedParams.id) {
      return Response.json({ error: "Não é permitido excluir o próprio usuário logado." }, { status: 400, headers: noStoreHeaders });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingUser) {
      return Response.json({ error: "Usuário não encontrado." }, { status: 404, headers: noStoreHeaders });
    }

    if (session.organizationId && existingUser.organizationId !== session.organizationId) {
      return Response.json({ error: "Acesso não autorizado a este usuário." }, { status: 403, headers: noStoreHeaders });
    }

    await prisma.$transaction([
      prisma.cardAssignee.deleteMany({ where: { userId: resolvedParams.id } }),
      prisma.cardComment.updateMany({ where: { userId: resolvedParams.id }, data: { userId: null } }),
      prisma.card.updateMany({ where: { createdById: resolvedParams.id }, data: { createdById: null } }),
      prisma.user.delete({ where: { id: resolvedParams.id } }),
    ]);

    await persistDatabase();
    return Response.json({ success: true, message: "Usuário excluído com sucesso." }, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    const status = error.status || error.statusCode || 500;
    return Response.json({ error: error.message || "Erro ao excluir usuário." }, { status, headers: noStoreHeaders });
  }
}
