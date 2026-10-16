import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.ts";
import { PipeService } from "../src/services/pipeService.ts";
import { CardService } from "../src/services/cardService.ts";

test("Task 4: Automation Engine & Webhook Dispatcher Tests", async () => {
  const pipes = await PipeService.listPipes();
  const pipe = await PipeService.getPipeById(pipes[0].id);
  assert.ok(pipe);

  // 1. Criar lead para testar automação de CARD_CREATED (atribuição a Carlos SDR)
  const lead = await CardService.createCard({
    pipeId: pipe.id,
    title: "Lead Automação SDR Ltda",
    fieldValues: {
      lead_name: "Marcos Paulo",
      lead_email: "marcos@automacao.com",
      company_name: "Automação Tech",
    },
  });
  assert.ok(lead);

  // Verificar se o card foi atribuído a um usuário pela automação
  const sdrUser = await prisma.user.findFirst({ where: { email: "carlos@flowleads.com" } });
  assert.ok(sdrUser);

  const reloadedCard = await CardService.getCardById(lead.id);
  assert.ok(reloadedCard?.assignees.some((a) => a.userId === sdrUser.id), "Automação deveria ter atribuído Carlos SDR");

  // 2. Testar automação de CARD_MOVED para Proposta Enviada -> Deve disparar e-mail de proposta
  const proposalPhase = pipe.phases.find((p) => p.name === "Proposta Enviada");
  assert.ok(proposalPhase);

  await CardService.moveCard(lead.id, proposalPhase.id, {
    payment_terms: "Anual à vista (15% desconto)",
  });

  const emails = await prisma.emailOutbox.findMany({
    where: { cardId: lead.id },
  });
  assert.ok(emails.length > 0, "Deveria ter gerado e-mail na outbox via automação");
  assert.ok(emails[0].subject.includes("Proposta Comercial"));

  // 3. Verificar métricas da automação
  const automations = await prisma.automation.findMany({
    where: { pipeId: pipe.id },
  });
  assert.ok(automations.some((a) => a.executionsCount > 0));
});