import test from "node:test";
import assert from "node:assert/strict";
import { PipeService } from "../src/services/pipeService.ts";
import { CardService } from "../src/services/cardService.ts";
import { SlaService } from "../src/services/slaService.ts";

test("Task 3: Domain Services Unit & Integration Tests", async () => {
  // 1. Listar Pipes
  const pipes = await PipeService.listPipes();
  assert.ok(pipes.length > 0);
  const pipe = await PipeService.getPipeById(pipes[0].id);
  assert.ok(pipe);
  assert.equal(pipe?.phases.length, 7);

  // 2. Criar Card
  const newLead = await CardService.createCard({
    pipeId: pipe.id,
    title: "Empresa Teste Inbound Ltda",
    dealValue: 15000,
    fieldValues: {
      lead_name: "Ana Teste",
      lead_email: "ana@teste.com",
      company_name: "Empresa Teste",
    },
  });
  assert.ok(newLead);
  assert.equal(newLead.title, "EMPRESA TESTE INBOUND LTDA");
  assert.equal(newLead.currentPhase.name, "Novos Leads");

  // 3. Tentar mover para "Qualificação (SDR)" SEM preencher campos obrigatórios
  const qualifyPhase = pipe.phases.find((p) => p.name === "Qualificação (SDR)");
  assert.ok(qualifyPhase);

  let errorThrown = false;
  try {
    await CardService.moveCard(newLead.id, qualifyPhase.id);
  } catch (err: any) {
    errorThrown = true;
    assert.ok(
      err.message.includes("Campos obrigatórios não preenchidos") ||
      err.message.includes("obrigatório preencher a Loja Negociada")
    );
  }
  assert.equal(errorThrown, true, "Deveria ter bloqueado avanço sem campo obrigatório");

  // 4. Mover para "Qualificação (SDR)" COM preenchimento dos campos obrigatórios
  const movedCard = await CardService.moveCard(newLead.id, qualifyPhase.id, {
    bant_budget: "R$ 5.000 a R$ 20.000/mês",
    store_negotiated: "ÓTICA MÁRIO NETO - MATRIZ",
    estimated_visit_datetime: "2026-10-25T14:00:00",
  });
  assert.ok(movedCard);
  assert.equal(movedCard.currentPhaseId, qualifyPhase.id);
  assert.ok(movedCard.activities.some((a) => a.actionType === "MOVED"));

  // 5. Testar SlaService
  const now = new Date();
  const resOnTrack = SlaService.calculateSla(now, 24);
  assert.equal(resOnTrack.status, "ON_TRACK");

  const warningDate = new Date(Date.now() - 18 * 60 * 60 * 1000); // 18h atrás num SLA de 24h = 75%
  const resWarning = SlaService.calculateSla(warningDate, 24);
  assert.equal(resWarning.status, "WARNING");

  const overdueDate = new Date(Date.now() - 30 * 60 * 60 * 1000); // 30h atrás
  const resOverdue = SlaService.calculateSla(overdueDate, 24);
  assert.equal(resOverdue.status, "OVERDUE");
});