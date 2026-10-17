import { prisma } from "../lib/prisma.ts";
import { AutomationEngine } from "./automationEngine.ts";
import { maskPhone } from "../lib/utils.ts";

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
        creator: { select: { id: true, name: true, email: true, whatsappNumber: true } },
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
        creator: { select: { id: true, name: true, email: true, whatsappNumber: true } },
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

    const cleanTitle = (input.title || "").trim().toUpperCase();

    const card = await prisma.card.create({
      data: {
        pipeId: input.pipeId,
        currentPhaseId: targetPhaseId,
        title: cleanTitle,
        dealValue: input.dealValue ?? 0,
        priority: input.priority ?? "MEDIUM",
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        createdById: input.createdById,
        phaseEnteredAt: new Date(),
      },
    });

    if (input.createdById) {
      await prisma.cardAssignee.upsert({
        where: { cardId_userId: { cardId: card.id, userId: input.createdById } },
        create: { cardId: card.id, userId: input.createdById },
        update: {},
      }).catch(() => {});
    }

    // Auto-vincular checklist padrão cadastrado pelo Supervisor
    const org = await prisma.organization.findFirst();
    if (org) {
      const standardItems = await prisma.checklistItem.findMany({
        where: { organizationId: org.id, isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
      if (standardItems.length > 0) {
        await prisma.cardChecklist.create({
          data: {
            cardId: card.id,
            title: "Checklist do Lead",
            items: JSON.stringify(
              standardItems.map((si) => ({
                id: si.id,
                text: si.title,
                completed: false,
              }))
            ),
          },
        }).catch(() => {});
      }
    }

    // Se houver valores de campos iniciais (Start Form)
    if (input.fieldValues && Object.keys(input.fieldValues).length > 0) {
      const fields = await prisma.field.findMany({
        where: { pipeId: input.pipeId },
      });
      const fieldMap = new Map(fields.map((f) => [f.identifier, f.id]));

      for (const [key, val] of Object.entries(input.fieldValues)) {
        const fieldId = fieldMap.get(key);
        if (fieldId && val !== undefined && val !== null && String(val).trim() !== "") {
          let strVal = String(val).trim();
          if (key.includes("phone")) {
            strVal = maskPhone(strVal);
          } else if (!key.includes("email") && !key.includes("url") && !key.includes("link")) {
            strVal = strVal.toUpperCase();
          }
          await prisma.cardFieldValue.upsert({
            where: { cardId_fieldId: { cardId: card.id, fieldId } },
            create: { cardId: card.id, fieldId, value: strVal },
            update: { value: strVal },
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

    // Regra de Negócio Ótica FlowLeads: Para movimentar o lead saindo da fase inicial para o próximo passo,
    // é obrigatório que a Loja Negociada e a Data/Hora da Visita estejam preenchidos.
    const isMovingOutOfInitial = (card.currentPhase.order === 1 || /novo/i.test(card.currentPhase.name)) &&
      targetPhaseId !== card.currentPhaseId;

    if (isMovingOutOfInitial) {
      const allFields = await prisma.field.findMany({ where: { pipeId: card.pipeId } });
      const storeField = allFields.find((f) => f.identifier === "store_negotiated");
      const visitField = allFields.find((f) => f.identifier === "estimated_visit_datetime");

      const hasStore = storeField && updatedValues.some((v) => v.fieldId === storeField.id && v.value && v.value.trim().length > 0);
      const hasVisit = visitField && updatedValues.some((v) => v.fieldId === visitField.id && v.value && v.value.trim().length > 0);

      if (!hasStore || !hasVisit) {
        throw new Error("Para movimentar o lead para o próximo passo, é obrigatório preencher a Loja Negociada e a Data/Hora da Visita à Loja.");
      }
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

  static async updateCardTitle(cardId: string, title: string, userId?: string) {
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new Error("Título do card não pode ser vazio.");
    }
    const cleanTitle = title.trim().toUpperCase();
    await prisma.card.update({
      where: { id: cardId },
      data: { title: cleanTitle },
    });
    await prisma.cardActivity.create({
      data: {
        cardId,
        userId,
        actionType: "FIELD_UPDATED",
        details: `Card renomeado para "${cleanTitle}".`,
      },
    });
    return this.getCardById(cardId);
  }

  static async updateCardFields(cardId: string, fieldValues: Record<string, string>, userId?: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { currentPhase: true },
    });
    if (!card) throw new Error("Card não encontrado.");

    const closingFieldKeys = new Set(["os_number", "sale_amount", "seller_name", "sale_date"]);
    const isWonPhase = Boolean(card.currentPhase?.isFinalWon || /ganho|fechado\s*ganho/i.test(card.currentPhase?.name || ""));

    for (const [key, val] of Object.entries(fieldValues)) {
      if (closingFieldKeys.has(key) && !isWonPhase && val !== undefined && val !== null && String(val).trim() !== "") {
        throw new Error("Campos como número de OS, valor final, vendedor que atendeu e data da venda só podem ser preenchidos quando o lead fechar negócio.");
      }
    }

    const fields = await prisma.field.findMany({ where: { pipeId: card.pipeId } });
    const fieldMap = new Map(fields.map((f) => [f.identifier, f.id]));

    let newDealValue: number | null = null;

    for (const [key, val] of Object.entries(fieldValues)) {
      let fieldId = fieldMap.get(key) || key;

      // Auto-create missing field in Pipe if not present
      if (!fieldMap.has(key)) {
        try {
          const newF = await prisma.field.create({
            data: {
              pipeId: card.pipeId,
              identifier: key,
              label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              type: key.includes("date") ? "DATE" : key.includes("amount") || key.includes("value") ? "CURRENCY" : "TEXT",
              order: 99,
            },
          });
          fieldId = newF.id;
          fieldMap.set(key, fieldId);
        } catch {
          // ignore if already exists or concurrent
        }
      }

      let strVal = String(val ?? "").trim();
      if (key.includes("phone")) {
        strVal = maskPhone(strVal);
      } else if (!key.includes("email") && !key.includes("url") && !key.includes("link")) {
        strVal = strVal.toUpperCase();
      }

      await prisma.cardFieldValue.upsert({
        where: { cardId_fieldId: { cardId, fieldId } },
        create: { cardId, fieldId, value: strVal },
        update: { value: strVal },
      });

      if (key === "sale_amount" || key === "deal_value" || key === "dealValue") {
        const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
        if (!isNaN(parsed)) {
          newDealValue = parsed;
        }
      }
    }

    const cardUpdates: any = {};
    if (newDealValue !== null) {
      cardUpdates.dealValue = newDealValue;
    }
    if (fieldValues.lead_name && fieldValues.lead_name.trim()) {
      cardUpdates.title = fieldValues.lead_name.trim().toUpperCase();
    }
    if (Object.keys(cardUpdates).length > 0) {
      await prisma.card.update({
        where: { id: cardId },
        data: cardUpdates,
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

    // Cascading deletion of all card dependencies

    await prisma.cardFieldValue.deleteMany({ where: { cardId } });
    await prisma.cardLabel.deleteMany({ where: { cardId } });
    await prisma.cardAssignee.deleteMany({ where: { cardId } });
    await prisma.cardChecklist.deleteMany({ where: { cardId } });
    await prisma.cardComment.deleteMany({ where: { cardId } });
    await prisma.cardActivity.deleteMany({ where: { cardId } });
    await prisma.cardAttachment.deleteMany({ where: { cardId } });
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
export const updateCardTitle = CardService.updateCardTitle.bind(CardService);
export const addCardAttachment = CardService.addCardAttachment.bind(CardService);