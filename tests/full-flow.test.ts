import test from "node:test";
import assert from "node:assert/strict";
import { POST as submitPublicForm } from "../src/app/api/public-form/[slug]/route.ts";
import { CardService } from "../src/services/cardService.ts";
import { PipeService } from "../src/services/pipeService.ts";
import { GET as getReports } from "../src/app/api/reports/route.ts";
import { prisma } from "../src/lib/prisma.ts";

test("Task 14: Full End-to-End Flow Test (FlowLeads CRM Workflow)", async () => {
  // 1. Submissão pública de Lead
  const leadPayload = {
    lead_name: "Guilherme Siqueira",
    lead_email: "guilherme@industriaboreal.com.br",
    lead_phone: "(19) 98112-3344",
    company_name: "Indústria Boreal Equipamentos",
    deal_value: "60000",
    lead_need: "Necessidade de estruturação de processos e funil de vendas em equipe de 15 pessoas.",
  };

  const submitReq = new Request("http://localhost/api/public-form/crm-vendas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadPayload),
  });

  const submitRes = await submitPublicForm(submitReq, {
    params: Promise.resolve({ slug: "crm-vendas" }),
  });
  assert.equal(submitRes.status, 201);
  const submitData = await submitRes.json();
  const cardId = submitData.cardId;
  assert.ok(cardId);

  // 2. Verificar que o card foi criado na fase "Novos Leads"
  let card = await CardService.getCardById(cardId);
  assert.ok(card);
  assert.equal(card.currentPhase.name, "Novos Leads");
  assert.equal(card.dealValue, 60000);

  // 3. Verificar se automação atribuiu o SDR
  assert.ok(card.assignees.length > 0, "Card deveria ter sido atribuído pela automação de CARD_CREATED");

  // 4. Adicionar nota/comentário de atendimento
  const comment = await CardService.addComment(cardId, "Carlos SDR", "Primeiro contato realizado via WhatsApp. Lead qualificado e interessado.");
  assert.ok(comment);

  // 5. Mover para "Qualificação (SDR)" com campo obrigatório bant_budget
  const pipes = await PipeService.listPipes();
  const pipe = await PipeService.getPipeById(pipes[0].id);
  assert.ok(pipe);

  const phaseQualify = pipe.phases.find((p) => p.name === "Qualificação (SDR)");
  assert.ok(phaseQualify);

  card = await CardService.moveCard(cardId, phaseQualify.id, {
    bant_budget: "Acima de R$ 20.000/mês",
  });
  assert.equal(card.currentPhaseId, phaseQualify.id);

  // 6. Mover para "Proposta Enviada" com campo obrigatório payment_terms
  const phaseProposal = pipe.phases.find((p) => p.name === "Proposta Enviada");
  assert.ok(phaseProposal);

  card = await CardService.moveCard(cardId, phaseProposal.id, {
    payment_terms: "Anual à vista (15% desconto)",
  });
  assert.equal(card.currentPhaseId, phaseProposal.id);

  // 7. Verificar que a automação disparou e-mail de proposta
  const emails = await prisma.emailOutbox.findMany({ where: { cardId } });
  assert.ok(emails.length > 0);
  assert.ok(emails[0].subject.includes("Proposta Comercial"));

  // 8. Mover para "Fechado Ganho (Won)"
  const phaseWon = pipe.phases.find((p) => p.isFinalWon);
  assert.ok(phaseWon);

  card = await CardService.moveCard(cardId, phaseWon.id);
  assert.equal(card.currentPhaseId, phaseWon.id);
  assert.equal(card.currentPhase.isFinalWon, true);

  // 9. Verificar que o relatório analítico contabilizou o fechamento
  const reportReq = new Request(`http://localhost/api/reports?pipeId=${pipe.id}`);
  const reportRes = await getReports(reportReq);
  const reportData = await reportRes.json();

  assert.ok(reportData.summary.wonCards >= 1);
  assert.ok(reportData.summary.wonValue >= 60000);
});
