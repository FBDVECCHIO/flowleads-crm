import { prisma } from "../lib/prisma.ts";
import { persistDatabase, ensureDatabaseReady } from "../lib/dbSync.ts";
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
    await ensureDatabaseReady();
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
    await ensureDatabaseReady();
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
    await ensureDatabaseReady();
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

    const targetPhase = await prisma.phase.findUnique({ where: { id: targetPhaseId } });
    const isTargetWon = Boolean(targetPhase?.isFinalWon || /fechado\s*ganho|ganho/i.test(targetPhase?.name || ""));

    let dealVal = input.dealValue ?? 0;
    const osValRaw = input.fieldValues?.os_value || input.fieldValues?.valor_os || input.fieldValues?.sale_amount;
    if (osValRaw) {
      const parsed = parseFloat(String(osValRaw).replace(/[^0-9.,]/g, "").replace(",", "."));
      if (!isNaN(parsed) && parsed > 0) {
        dealVal = parsed;
      }
    } else if (!dealVal && input.fieldValues?.initial_estimated_value) {
      const parsed = parseFloat(String(input.fieldValues.initial_estimated_value).replace(/[^0-9.,]/g, "").replace(",", "."));
      if (!isNaN(parsed)) {
        dealVal = parsed;
      }
    }

    if (isTargetWon) {
      const osNumber = input.fieldValues?.os_number || input.fieldValues?.numero_os;
      const osSeller = input.fieldValues?.os_seller || input.fieldValues?.vendedor_os || input.fieldValues?.seller_name;
      const missingOS: string[] = [];
      if (!osNumber) missingOS.push("Número da OS");
      if (!osValRaw) missingOS.push("Valor da OS");
      if (!osSeller) missingOS.push("Vendedor da OS");

      if (missingOS.length > 0) {
        throw new Error(
          `Para cadastrar o lead diretamente no status FECHADO (GANHO), é obrigatório preencher os dados da Ordem de Serviço: ${missingOS.join(", ")}.`
        );
      }
    }

    const card = await prisma.card.create({
      data: {
        pipeId: input.pipeId,
        currentPhaseId: targetPhaseId,
        title: cleanTitle,
        dealValue: dealVal,
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

    await persistDatabase();
    return this.getCardById(card.id);
  }

  static async moveCard(
    cardId: string,
    targetPhaseId: string,
    fieldValuesToFulfill?: Record<string, string>,
    userId?: string
  ) {
    await ensureDatabaseReady();
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

    // Regra mandatória: FECHADO (GANHO) exige Número da OS, Valor da OS e Vendedor da OS
    const isTargetWon = Boolean(targetPhase.isFinalWon || /fechado\s*ganho|ganho/i.test(targetPhase.name));
    let finalDealValue = card.dealValue;

    if (isTargetWon) {
      const allFields = await prisma.field.findMany({ where: { pipeId: card.pipeId } });
      const fieldIdToIdent = new Map(allFields.map((f) => [f.id, f.identifier.toLowerCase()]));

      const valuesMap: Record<string, string> = {};
      for (const uv of updatedValues) {
        const ident = fieldIdToIdent.get(uv.fieldId);
        if (ident && uv.value) {
          valuesMap[ident] = uv.value.trim();
        }
      }
      if (fieldValuesToFulfill) {
        for (const [k, v] of Object.entries(fieldValuesToFulfill)) {
          if (v) valuesMap[k.toLowerCase()] = String(v).trim();
        }
      }

      const osNumber = valuesMap["os_number"] || valuesMap["numero_os"];
      const osValueRaw = valuesMap["os_value"] || valuesMap["valor_os"] || valuesMap["sale_amount"];
      const osSeller = valuesMap["os_seller"] || valuesMap["vendedor_os"] || valuesMap["seller_name"];

      const missingOS: string[] = [];
      if (!osNumber) missingOS.push("Número da OS");
      if (!osValueRaw) missingOS.push("Valor da OS");
      if (!osSeller) missingOS.push("Vendedor da OS");

      if (missingOS.length > 0) {
        throw new Error(
          `Para colocar o lead no status FECHADO (GANHO), é obrigatório preencher os dados da Ordem de Serviço da loja: ${missingOS.join(", ")}.`
        );
      }

      if (osValueRaw) {
        const parsed = parseFloat(String(osValueRaw).replace(/[^0-9.,]/g, "").replace(",", "."));
        if (!isNaN(parsed) && parsed > 0) {
          finalDealValue = parsed;
        }
      }
    }

    // Mover de fase
    const oldPhaseId = card.currentPhaseId;
    const oldPhaseName = card.currentPhase.name;
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        currentPhaseId: targetPhaseId,
        dealValue: finalDealValue,
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

    await persistDatabase();
    return this.getCardById(cardId);
  }

  static async updateCardTitle(cardId: string, title: string, userId?: string) {
    await ensureDatabaseReady();
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new Error("Título do card não pode ser vazio.");
    }
    const cleanTitle = title.trim().toUpperCase();
    const card = await prisma.card.update({
      where: { id: cardId },
      data: { title: cleanTitle },
      include: { pipe: { include: { fields: true } } },
    });

    // Sincronizar CardFieldValue para lead_name / name / nome / cliente para evitar regressão ao re-buscar dados
    const nameFields = (card.pipe?.fields || []).filter((f) =>
      ["lead_name", "name", "nome", "cliente"].includes(f.identifier.toLowerCase())
    );
    for (const nameField of nameFields) {
      await prisma.cardFieldValue.upsert({
        where: { cardId_fieldId: { cardId, fieldId: nameField.id } },
        create: { cardId, fieldId: nameField.id, value: cleanTitle },
        update: { value: cleanTitle },
      }).catch(() => {});
    }

    await prisma.cardActivity.create({
      data: {
        cardId,
        userId,
        actionType: "FIELD_UPDATED",
        details: `Card renomeado para "${cleanTitle}".`,
      },
    });

    await persistDatabase();
    return this.getCardById(cardId);
  }

  static async updateCardFields(cardId: string, fieldValues: Record<string, string>, userId?: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { currentPhase: true },
    });
    if (!card) throw new Error("Card não encontrado.");

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

      if (key === "os_value" || key === "valor_os" || key === "sale_amount") {
        const parsed = parseFloat(String(val).replace(/[^0-9.,]/g, "").replace(",", "."));
        if (!isNaN(parsed) && parsed > 0) {
          newDealValue = parsed;
        }
      } else if (newDealValue === null && (key === "initial_estimated_value" || key === "deal_value" || key === "dealValue" || key === "valor_estimado")) {
        const parsed = parseFloat(String(val).replace(/[^0-9.,]/g, "").replace(",", "."));
        if (!isNaN(parsed)) {
          newDealValue = parsed;
        }
      }
    }

    const cardUpdates: any = {};
    if (newDealValue !== null) {
      cardUpdates.dealValue = newDealValue;
    }
    const updatedLeadName = fieldValues.lead_name || fieldValues.nome_do_lead;
    if (updatedLeadName && updatedLeadName.trim()) {
      cardUpdates.title = updatedLeadName.trim().toUpperCase();
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

    await persistDatabase();
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

    await persistDatabase();
    return comment;
  }

  static async deleteCard(cardId: string, userId?: string, userRole?: string): Promise<void> {
    await ensureDatabaseReady();
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      const error: any = new Error("Card não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    // Cascading deletion of all card dependencies atomically
    await prisma.$transaction([
      prisma.cardFieldValue.deleteMany({ where: { cardId } }),
      prisma.cardLabel.deleteMany({ where: { cardId } }),
      prisma.cardAssignee.deleteMany({ where: { cardId } }),
      prisma.cardChecklist.deleteMany({ where: { cardId } }),
      prisma.cardComment.deleteMany({ where: { cardId } }),
      prisma.cardActivity.deleteMany({ where: { cardId } }),
      prisma.cardAttachment.deleteMany({ where: { cardId } }),
      prisma.emailOutbox.deleteMany({ where: { cardId } }),
      prisma.card.delete({ where: { id: cardId } }),
    ]);

    await persistDatabase();
  }

  static async updateCardColor(cardId: string, color: string) {
    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
      throw new Error("Cor hexadecimal inválida.");
    }
    const res = await prisma.card.update({
      where: { id: cardId },
      data: { color },
    });
    await persistDatabase();
    return res;
  }

  static async addCardAttachment(
    cardId: string,
    fileData: { fileName: string; fileUrl: string; mimeType: string; sizeBytes: number }
  ) {
    await ensureDatabaseReady();
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

    await persistDatabase();
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