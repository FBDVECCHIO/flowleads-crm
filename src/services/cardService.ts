import { prisma } from "../lib/prisma.ts";
import { AutomationEngine } from "./automationEngine.ts";

export interface CreateCardInput {
  pipeId: string;
  phaseId?: string;
  title: string;
  dealValue?: number;
  priority?: string;
  dueDate?: Date | string;
  createdById?: string;
  fieldValues?: Record<string, string>; // fieldIdentifier -> value
}

export class CardService {
  static async listCards(pipeId: string, phaseId?: string) {
    const where: any = { pipeId };
    if (phaseId) where.currentPhaseId = phaseId;

    return prisma.card.findMany({
      where,
      include: {
        currentPhase: true,
        assignees: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
        labels: { include: { label: true } },
        values: { include: { field: true } },
        checklists: true,
        attachments: true,
        _count: {
          select: { comments: true, checklists: true, attachments: true },
        },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });
  }

  static async getCardById(cardId: string) {
    return prisma.card.findUnique({
      where: { id: cardId },
      include: {
        currentPhase: true,
        pipe: {
          include: {
            phases: { orderBy: { order: "asc" } },
            fields: { orderBy: { order: "asc" } },
            labels: true,
          },
        },
        assignees: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
        labels: { include: { label: true } },
        values: { include: { field: true } },
        checklists: true,
        attachments: true,
        comments: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  static async createCard(input: CreateCardInput) {
    let targetPhaseId = input.phaseId;
    if (!targetPhaseId) {
      const firstPhase = await prisma.phase.findFirst({
        where: { pipeId: input.pipeId },
        orderBy: { order: "asc" },
      });
      if (!firstPhase) throw new Error("O Pipe não possui fases cadastradas.");
      targetPhaseId = firstPhase.id;
    }

    const card = await prisma.card.create({
      data: {
        pipeId: input.pipeId,
        currentPhaseId: targetPhaseId,
        title: input.title,
        dealValue: input.dealValue ?? 0,
        priority: input.priority ?? "MEDIUM",
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        createdById: input.createdById,
        phaseEnteredAt: new Date(),
      },
    });

    // Se houver valores de campos iniciais (Start Form)
    if (input.fieldValues && Object.keys(input.fieldValues).length > 0) {
      const fields = await prisma.field.findMany({
        where: { pipeId: input.pipeId },
      });
      const fieldMap = new Map(fields.map((f) => [f.identifier, f.id]));

      for (const [key, val] of Object.entries(input.fieldValues)) {
        const fieldId = fieldMap.get(key);
        if (fieldId && val !== undefined && val !== null && String(val).trim() !== "") {
          await prisma.cardFieldValue.upsert({
            where: { cardId_fieldId: { cardId: card.id, fieldId } },
            create: { cardId: card.id, fieldId, value: String(val) },
            update: { value: String(val) },
          });
        }
      }
    }

    // Registrar atividade inicial
    await prisma.cardActivity.create({
      data: {
        cardId: card.id,
        actionType: "CREATED",
        details: `Card criado na fase inicial.`,
      },
    });

    // Disparar automações de criação de card em segundo plano
    await AutomationEngine.triggerCardCreated(card.id);

    return this.getCardById(card.id);
  }

  static async moveCard(
    cardId: string,
    targetPhaseId: string,
    fieldValuesToFulfill?: Record<string, string>,
    userId?: string
  ) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        currentPhase: true,
        values: true,
      },
    });
    if (!card) throw new Error("Card não encontrado.");

    if (card.currentPhaseId === targetPhaseId) return card;

    const targetPhase = await prisma.phase.findUnique({
      where: { id: targetPhaseId },
      include: { fields: true },
    });
    if (!targetPhase) throw new Error("Fase de destino não encontrada.");

    // Atualizar valores passados na transição, se houver
    if (fieldValuesToFulfill && Object.keys(fieldValuesToFulfill).length > 0) {
      const allFields = await prisma.field.findMany({ where: { pipeId: card.pipeId } });
      const fieldMap = new Map(allFields.map((f) => [f.identifier, f.id]));

      for (const [key, val] of Object.entries(fieldValuesToFulfill)) {
        const fieldId = fieldMap.get(key);
        if (fieldId && val !== undefined && val !== null && String(val).trim() !== "") {
          await prisma.cardFieldValue.upsert({
            where: { cardId_fieldId: { cardId: card.id, fieldId } },
            create: { cardId: card.id, fieldId, value: String(val) },
            update: { value: String(val) },
          });
        }
      }
    }

    // Re-buscar valores atualizados para conferir campos obrigatórios da fase de destino
    const updatedValues = await prisma.cardFieldValue.findMany({
      where: { cardId },
    });
    const fulfilledFieldIds = new Set(
      updatedValues.filter((v) => v.value && v.value.trim().length > 0).map((v) => v.fieldId)
    );

    // Validação de campos obrigatórios da fase de destino
    const missingRequiredFields = targetPhase.fields.filter(
      (f) => f.isRequired && !fulfilledFieldIds.has(f.id)
    );

    if (missingRequiredFields.length > 0) {
      const names = missingRequiredFields.map((f) => f.label).join(", ");
      throw new Error(`Campos obrigatórios não preenchidos para avançar para a fase "${targetPhase.name}": ${names}`);
    }

    // Mover de fase
    const oldPhaseId = card.currentPhaseId;
    const oldPhaseName = card.currentPhase.name;
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        currentPhaseId: targetPhaseId,
        phaseEnteredAt: new Date(),
        slaStatus: "ON_TRACK",
      },
    });

    // Registrar histórico
    await prisma.cardActivity.create({
      data: {
        cardId,
        userId,
        actionType: "MOVED",
        details: `Card movido de "${oldPhaseName}" para "${targetPhase.name}".`,
      },
    });

    // Disparar automações de movimentação
    await AutomationEngine.triggerCardMoved(cardId, oldPhaseId, targetPhaseId);

    return this.getCardById(cardId);
  }

  static async updateCardFields(cardId: string, fieldValues: Record<string, string>, userId?: string) {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new Error("Card não encontrado.");

    const fields = await prisma.field.findMany({ where: { pipeId: card.pipeId } });
    const fieldMap = new Map(fields.map((f) => [f.identifier, f.id]));

    for (const [key, val] of Object.entries(fieldValues)) {
      const fieldId = fieldMap.get(key) || key;
      await prisma.cardFieldValue.upsert({
        where: { cardId_fieldId: { cardId, fieldId } },
        create: { cardId, fieldId, value: String(val ?? "") },
        update: { value: String(val ?? "") },
      });
    }

    await prisma.cardActivity.create({
      data: {
        cardId,
        userId,
        actionType: "FIELD_UPDATED",
        details: `Valores de campos foram atualizados.`,
      },
    });

    return this.getCardById(cardId);
  }

  static async addComment(cardId: string, authorName: string, content: string, userId?: string) {
    const comment = await prisma.cardComment.create({
      data: {
        cardId,
        userId,
        authorName,
        content,
      },
    });

    await prisma.cardActivity.create({
      data: {
        cardId,
        userId,
        actionType: "COMMENTED",
        details: `Comentário adicionado por ${authorName}.`,
      },
    });

    return comment;
  }

  static async deleteCard(cardId: string, userId?: string, userRole?: string): Promise<void> {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      const error: any = new Error("Card não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    if (userRole) {
      const isPrivileged = userRole === "SUPERVISOR" || userRole === "ADMIN";
      const isCreator = Boolean(userId && card.createdById === userId);
      if (!isPrivileged && !isCreator) {
        const error: any = new Error("Acesso não autorizado para excluir este card.");
        error.statusCode = 403;
        throw error;
      }
    }

    await prisma.card.delete({ where: { id: cardId } });
  }

  static async updateCardColor(cardId: string, color: string) {
    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
      throw new Error("Cor hexadecimal inválida.");
    }
    return prisma.card.update({
      where: { id: cardId },
      data: { color },
    });
  }

  static async addCardAttachment(
    cardId: string,
    fileData: { fileName: string; fileUrl: string; mimeType: string; sizeBytes: number }
  ) {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new Error("Card não encontrado.");

    const attachment = await prisma.cardAttachment.create({
      data: {
        cardId,
        fileName: fileData.fileName,
        fileUrl: fileData.fileUrl,
        mimeType: fileData.mimeType,
        sizeBytes: fileData.sizeBytes,
      },
    });

    await prisma.cardActivity.create({
      data: {
        cardId,
        actionType: "ATTACHMENT_ADDED",
        details: `Documento "${fileData.fileName}" anexado com sucesso.`,
      },
    });

    return attachment;
  }
}

// Standalone exported functions matching interface contracts and test suite imports
export const listCards = CardService.listCards.bind(CardService);
export const getCardById = CardService.getCardById.bind(CardService);
export const createCard = CardService.createCard.bind(CardService);
export const moveCard = CardService.moveCard.bind(CardService);
export const updateCardFields = CardService.updateCardFields.bind(CardService);
export const addComment = CardService.addComment.bind(CardService);
export const deleteCard = CardService.deleteCard.bind(CardService);
export const updateCardColor = CardService.updateCardColor.bind(CardService);
export const addCardAttachment = CardService.addCardAttachment.bind(CardService);