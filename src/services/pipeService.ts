import { prisma } from "../lib/prisma.ts";
import { persistDatabase, ensureDatabaseReady } from "../lib/dbSync.ts";

export class PipeService {
  static async listPipes(organizationId?: string) {
    await ensureDatabaseReady();
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
    await ensureDatabaseReady();
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

    const newPhase = await prisma.phase.create({
      data: {
        pipeId,
        name: cleanName,
        order: newOrder,
        color,
      },
    });
    await persistDatabase();
    return newPhase;
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

    const updated = await prisma.phase.update({
      where: { id: phaseId },
      data: updateData,
    });
    await persistDatabase();
    return updated;
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

    const deleted = await prisma.phase.delete({ where: { id: phaseId } });
    await persistDatabase();
    return deleted;
  }

  static async reorderPhases(pipeId: string, orderedPhaseIds: string[]) {
    const allPhases = await prisma.phase.findMany({
      where: { pipeId },
      orderBy: { order: "asc" },
    });

    if (allPhases.length <= 1) return allPhases;

    const firstPhase =
      allPhases.find((p) => p.order === 1 || /^(novos?\s+leads?|novo\s+lead)$/i.test(p.name)) || allPhases[0];
    const lostPhase =
      allPhases.find((p) => p.isFinalLost || /^(fechado\s+perdido|perdido)$/i.test(p.name)) ||
      allPhases[allPhases.length - 1];
    const wonPhase =
      allPhases.find(
        (p) =>
          (p.isFinalWon || /^(fechado\s+ganho|fechado)$/i.test(p.name)) &&
          p.id !== lostPhase.id &&
          p.id !== firstPhase.id
      ) || allPhases[allPhases.length - 2];

    // Filter out immutable anchor phases from reorderable list
    const anchorIds = new Set([firstPhase.id, wonPhase?.id, lostPhase.id].filter(Boolean));
    const requestedIntermediates = orderedPhaseIds.filter((id) => !anchorIds.has(id));
    const existingIntermediates = allPhases.filter((p) => !anchorIds.has(p.id));

    // Ensure all existing intermediates are present
    const validIntermediateIds = requestedIntermediates.filter((id) =>
      existingIntermediates.some((p) => p.id === id)
    );
    for (const ep of existingIntermediates) {
      if (!validIntermediateIds.includes(ep.id)) {
        validIntermediateIds.push(ep.id);
      }
    }

    // Build the final strict order:
    // 1. firstPhase (NOVOS LEADS)
    // 2..N-2. validIntermediateIds
    // N-1. wonPhase (FECHADO)
    // N. lostPhase (PERDIDO)
    const finalSequence = [
      firstPhase.id,
      ...validIntermediateIds,
      ...(wonPhase && wonPhase.id !== firstPhase.id ? [wonPhase.id] : []),
      ...(lostPhase && lostPhase.id !== firstPhase.id && lostPhase.id !== wonPhase?.id ? [lostPhase.id] : []),
    ];

    // Use transaction to update orders
    await prisma.$transaction(
      finalSequence.map((id, index) =>
        prisma.phase.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );
    await persistDatabase();

    return prisma.phase.findMany({
      where: { pipeId },
      orderBy: { order: "asc" },
    });
  }

  static async movePhaseDirection(pipeId: string, phaseId: string, direction: "left" | "right") {
    const allPhases = await prisma.phase.findMany({
      where: { pipeId },
      orderBy: { order: "asc" },
    });

    const targetPhase = allPhases.find((p) => p.id === phaseId);
    if (!targetPhase) throw new Error("Fase não encontrada.");

    if (isImmutablePhase(targetPhase)) {
      throw new Error("Colunas padrão do sistema (Novos Leads, Fechado e Perdido) não podem ser movidas.");
    }

    const firstPhase =
      allPhases.find((p) => p.order === 1 || /^(novos?\s+leads?|novo\s+lead)$/i.test(p.name)) || allPhases[0];
    const lostPhase =
      allPhases.find((p) => p.isFinalLost || /^(fechado\s+perdido|perdido)$/i.test(p.name)) ||
      allPhases[allPhases.length - 1];
    const wonPhase =
      allPhases.find(
        (p) =>
          (p.isFinalWon || /^(fechado\s+ganho|fechado)$/i.test(p.name)) &&
          p.id !== lostPhase.id &&
          p.id !== firstPhase.id
      ) || allPhases[allPhases.length - 2];

    const anchorIds = new Set([firstPhase.id, wonPhase?.id, lostPhase.id].filter(Boolean));
    const intermediatePhases = allPhases.filter((p) => !anchorIds.has(p.id));

    const currentIndex = intermediatePhases.findIndex((p) => p.id === phaseId);
    if (currentIndex === -1) throw new Error("Coluna não é reordenável.");

    const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= intermediatePhases.length) {
      // Cannot move further left or right
      return allPhases;
    }

    const reordered = [...intermediatePhases];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(newIndex, 0, moved);

    return this.reorderPhases(pipeId, reordered.map((p) => p.id));
  }
}

export function isImmutablePhase(phase: { name?: string; order?: number; isFinalWon?: boolean; isFinalLost?: boolean }): boolean {
  if (!phase) return false;
  if (phase.order === 1) return true;
  if (phase.isFinalWon) return true;
  if (phase.isFinalLost) return true;
  const normalized = (phase.name || "").trim().toLowerCase();
  if (
    /^(novos?\s+leads?|novo\s+lead)$/i.test(normalized) ||
    /^(fechado\s+ganho|fechado)$/i.test(normalized) ||
    /^(fechado\s+perdido|perdido)$/i.test(normalized)
  ) {
    return true;
  }
  return false;
}