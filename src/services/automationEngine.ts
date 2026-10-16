import { prisma } from "../lib/prisma.ts";
import { EmailOutboxService } from "./emailOutbox.ts";
import { WebhookDispatcher } from "./webhookDispatcher.ts";

export class AutomationEngine {
  static async triggerCardCreated(cardId: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { values: { include: { field: true } }, pipe: true },
    });
    if (!card) return;

    // Disparar Webhook
    await WebhookDispatcher.dispatch("card.created", card.pipeId, card);

    // Buscar automações ativas de criação de card
    const automations = await prisma.automation.findMany({
      where: {
        pipeId: card.pipeId,
        isActive: true,
        triggerType: "CARD_CREATED",
      },
    });

    for (const auto of automations) {
      await this.evaluateAndExecute(auto, card);
    }
  }

  static async triggerCardMoved(cardId: string, fromPhaseId: string, toPhaseId: string) {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { values: { include: { field: true } }, currentPhase: true, pipe: true },
    });
    if (!card) return;

    // Disparar Webhooks
    const eventName = card.currentPhase.isFinalWon
      ? "card.won"
      : card.currentPhase.isFinalLost
      ? "card.lost"
      : "card.moved";
    await WebhookDispatcher.dispatch(eventName, card.pipeId, card);

    // Buscar automações ativas de movimentação de card
    const automations = await prisma.automation.findMany({
      where: {
        pipeId: card.pipeId,
        isActive: true,
        triggerType: "CARD_MOVED",
      },
    });

    for (const auto of automations) {
      let config: any = {};
      try {
        config = JSON.parse(auto.triggerConfig || "{}");
      } catch (e) {}

      // Se a automação especificar uma fase de destino, só executa se bater
      if (config.phaseId && config.phaseId !== toPhaseId) {
        continue;
      }

      await this.evaluateAndExecute(auto, card);
    }
  }

  private static async evaluateAndExecute(auto: any, card: any) {
    // 1. Avaliar Condições
    let conditions: any[] = [];
    try {
      conditions = JSON.parse(auto.conditions || "[]");
    } catch (e) {}

    const valueMap = new Map(card.values.map((v: any) => [v.field.identifier, v.value]));

    for (const cond of conditions) {
      const val = valueMap.get(cond.fieldId) || "";
      if (cond.operator === "EQUALS" && val !== cond.value) return;
      if (cond.operator === "CONTAINS" && !String(val).toLowerCase().includes(String(cond.value).toLowerCase())) return;
      if (cond.operator === "GREATER_THAN" && Number(val) <= Number(cond.value)) return;
    }

    // 2. Executar Ação
    let actionConfig: any = {};
    try {
      actionConfig = JSON.parse(auto.actionConfig || "{}");
    } catch (e) {}

    switch (auto.actionType) {
      case "ASSIGN_USER":
        if (actionConfig.userId) {
          await prisma.cardAssignee.upsert({
            where: { cardId_userId: { cardId: card.id, userId: actionConfig.userId } },
            create: { cardId: card.id, userId: actionConfig.userId },
            update: {},
          });
          await prisma.cardActivity.create({
            data: {
              cardId: card.id,
              actionType: "AUTO_ASSIGNED",
              details: `Automação "${auto.name}" atribuiu o card automaticamente.`,
            },
          });
        }
        break;

      case "UPDATE_FIELD":
        if (actionConfig.fieldId && actionConfig.value !== undefined) {
          const field = await prisma.field.findFirst({
            where: { pipeId: card.pipeId, OR: [{ id: actionConfig.fieldId }, { identifier: actionConfig.fieldId }] },
          });
          if (field) {
            await prisma.cardFieldValue.upsert({
              where: { cardId_fieldId: { cardId: card.id, fieldId: field.id } },
              create: { cardId: card.id, fieldId: field.id, value: String(actionConfig.value) },
              update: { value: String(actionConfig.value) },
            });
            await prisma.cardActivity.create({
              data: {
                cardId: card.id,
                actionType: "AUTO_UPDATED",
                details: `Automação "${auto.name}" atualizou o campo "${field.label}".`,
              },
            });
          }
        }
        break;

      case "SEND_EMAIL":
        const leadEmailVal = valueMap.get("lead_email") || card.creator?.email || "contato@lead.com";
        const emailVars = {
          card: {
            title: card.title,
            deal_value: card.dealValue,
            lead_name: valueMap.get("lead_name") || "Cliente",
            company_name: valueMap.get("company_name") || "Empresa",
          },
        };
        const renderedSubject = EmailOutboxService.renderTemplate(actionConfig.emailSubject || "Notificação FlowLeads", emailVars);
        const renderedBody = EmailOutboxService.renderTemplate(actionConfig.emailBody || "Mensagem automática de acompanhamento.", emailVars);

        await EmailOutboxService.sendEmail({
          pipeId: card.pipeId,
          cardId: card.id,
          recipientEmail: leadEmailVal,
          subject: renderedSubject,
          body: renderedBody,
        });
        break;

      case "MOVE_CARD":
        if (actionConfig.targetPhaseId && actionConfig.targetPhaseId !== card.currentPhaseId) {
          await prisma.card.update({
            where: { id: card.id },
            data: { currentPhaseId: actionConfig.targetPhaseId, phaseEnteredAt: new Date() },
          });
          await prisma.cardActivity.create({
            data: {
              cardId: card.id,
              actionType: "AUTO_MOVED",
              details: `Automação "${auto.name}" moveu o card de fase automaticamente.`,
            },
          });
        }
        break;
    }

    // 3. Atualizar métricas da automação
    await prisma.automation.update({
      where: { id: auto.id },
      data: {
        executionsCount: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });
  }
}