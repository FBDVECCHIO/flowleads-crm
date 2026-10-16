import { prisma } from "../lib/prisma.ts";

export class EmailOutboxService {
  static async sendEmail(params: {
    pipeId: string;
    cardId?: string;
    recipientEmail: string;
    subject: string;
    body: string;
  }) {
    // Grava na outbox para auditoria e log
    const email = await prisma.emailOutbox.create({
      data: {
        pipeId: params.pipeId,
        cardId: params.cardId,
        recipientEmail: params.recipientEmail,
        subject: params.subject,
        body: params.body,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    if (params.cardId) {
      await prisma.cardActivity.create({
        data: {
          cardId: params.cardId,
          actionType: "EMAIL_SENT",
          details: `E-mail enviado para ${params.recipientEmail}: "${params.subject}"`,
        },
      });
    }

    return email;
  }

  static renderTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{([\w\.]+)\}\}/g, (_, key) => {
      const parts = key.split(".");
      let val: any = variables;
      for (const part of parts) {
        val = val?.[part];
      }
      return val !== undefined && val !== null ? String(val) : "";
    });
  }
}