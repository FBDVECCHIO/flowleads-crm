import { prisma } from "../lib/prisma.ts";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  pipeId: string;
  cardId?: string;
  data: any;
}

export class WebhookDispatcher {
  static async dispatch(event: string, pipeId: string, cardData: any) {
    const webhooks = await prisma.webhook.findMany({
      where: { pipeId, isActive: true },
    });

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      pipeId,
      cardId: cardData?.id,
      data: cardData,
    };

    const results = [];
    for (const hook of webhooks) {
      try {
        const events = JSON.parse(hook.events || "[]");
        if (events.length === 0 || events.includes(event)) {
          // Em ambiente local/dev ou testes, simula envio ou executa fetch se URL for válida
          let status = 200;
          if (hook.url.startsWith("http://") || hook.url.startsWith("https://")) {
            // Tentativa não bloqueante com timeout curto
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);
            try {
              const res = await fetch(hook.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
              });
              status = res.status;
            } catch (e) {
              status = 504; // Mock timeout/offline
            } finally {
              clearTimeout(timeout);
            }
          }
          results.push({ hookId: hook.id, status });
        }
      } catch (err) {
        results.push({ hookId: hook.id, status: 500 });
      }
    }

    return results;
  }
}