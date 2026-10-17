import { prisma } from "../lib/prisma.ts";

export class PipeService {
  static async listPipes(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};
    return prisma.pipe.findMany({
      where,
      include: {
        phases: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, color: true, order: true },
        },
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async getPipeById(pipeId: string) {
    return prisma.pipe.findUnique({
      where: { id: pipeId },
      include: {
        phases: {
          orderBy: { order: "asc" },
          include: {
            fields: { orderBy: { order: "asc" } },
          },
        },
        fields: {
          orderBy: { order: "asc" },
        },
        labels: true,
        automations: {
          orderBy: { createdAt: "desc" },
        },
        webhooks: true,
      },
    });
  }

  static async getPublicFormBySlug(slug: string) {
    const pipe = await prisma.pipe.findUnique({
      where: { publicFormSlug: slug, isPublicFormEnabled: true },
      include: {
        fields: {
          where: { phaseId: null }, // Start Form fields
          orderBy: { order: "asc" },
        },
        phases: {
          orderBy: { order: "asc" },
          take: 1, // Primeira fase (Inbox)
        },
      },
    });
    return pipe;
  }

  static async createPhase(pipeId: string, name: string, color: string = "#3b82f6") {
    if (!name || !name.trim()) {
      throw new Error("O nome da coluna / fase é obrigatório.");
    }
    const cleanName = name.trim().toUpperCase();

    // Buscar fases atuais para posicionar antes das fases finais
    const existingPhases = await prisma.phase.findMany({
      where: { pipeId },
      orderBy: { order: "asc" },
    });

    const finalPhases = existingPhases.filter((p) => p.isFinalWon || p.isFinalLost || /ganho|perdido/i.test(p.name));
    const nonFinalPhases = existingPhases.filter((p) => !p.isFinalWon && !p.isFinalLost && !/ganho|perdido/i.test(p.name));

    const newOrder = nonFinalPhases.length > 0
      ? Math.max(...nonFinalPhases.map((p) => p.order)) + 1
      : 2;

    // Se houver conflito de ordem com fases finais, empurrar as fases finais para a frente
    for (const fp of finalPhases) {
      if (fp.order <= newOrder) {
        await prisma.phase.update({
          where: { id: fp.id },
          data: { order: fp.order + 1 },
        });
      }
    }

    return prisma.phase.create({
      data: {
        pipeId,
        name: cleanName,
        order: newOrder,
        color,
      },
    });
  }

  static async updatePhase(phaseId: string, data: { name?: string; color?: string }) {
    const phase = await prisma.phase.findUnique({ where: { id: phaseId } });
    if (!phase) throw new Error("Coluna / Fase não encontrada.");

    if (isImmutablePhase(phase)) {
      throw new Error("Esta coluna é padrão e imutável do sistema (Novo Lead, Fechado ou Perdido) e não pode ser renomeada.");
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim().toUpperCase();
    if (data.color) updateData.color = data.color;

    return prisma.phase.update({
      where: { id: phaseId },
      data: updateData,
    });
  }

  static async deletePhase(phaseId: string) {
    const phase = await prisma.phase.findUnique({ where: { id: phaseId } });
    if (!phase) throw new Error("Coluna / Fase não encontrada.");

    if (isImmutablePhase(phase)) {
      throw new Error("Esta coluna é padrão e imutável do sistema (Novo Lead, Fechado ou Perdido) e não pode ser excluída.");
    }

    // Se houver cards na fase a ser excluída, mover preventivamente para a primeira fase (Novo Lead)
    const firstPhase = await prisma.phase.findFirst({
      where: { pipeId: phase.pipeId },
      orderBy: { order: "asc" },
    });

    if (firstPhase && firstPhase.id !== phase.id) {
      await prisma.card.updateMany({
        where: { currentPhaseId: phase.id },
        data: { currentPhaseId: firstPhase.id },
      });
    }

    return prisma.phase.delete({ where: { id: phaseId } });
  }
}

export function isImmutablePhase(phase: { name?: string; order?: number; isFinalWon?: boolean; isFinalLost?: boolean }): boolean {
  if (!phase) return false;
  if (phase.order === 1) return true;
  if (phase.isFinalWon) return true;
  if (phase.isFinalLost) return true;
  const normalized = (phase.name || "").trim().toLowerCase();
  if (
    normalized.includes("novo") ||
    normalized.includes("ganho") ||
    normalized.includes("fechado") ||
    normalized.includes("perdido")
  ) {
    return true;
  }
  return false;
}