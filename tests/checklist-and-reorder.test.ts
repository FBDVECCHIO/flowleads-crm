import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.ts";
import { PipeService } from "../src/services/pipeService.ts";
import { CardService } from "../src/services/cardService.ts";

test("Checklist Management & Card Auto-Attachment", async () => {
  const org = await prisma.organization.findFirst();
  assert.ok(org, "Organization must exist");

  // 1. Create a checklist item
  const item = await prisma.checklistItem.create({
    data: {
      organizationId: org.id,
      title: "Confirmar telefone de contato de teste",
      order: 10,
      isActive: true,
    },
  });
  assert.ok(item.id);
  assert.equal(item.title, "Confirmar telefone de contato de teste");

  // 2. Create a card and verify checklist items are auto-created
  const pipe = await prisma.pipe.findFirst({
    include: { phases: { orderBy: { order: "asc" } } },
  });
  assert.ok(pipe);

  const card = await CardService.createCard({
    pipeId: pipe.id,
    title: "Lead Checklist Test",
    fieldValues: {
      lead_name: "Cliente Teste Checklist",
      lead_phone: "11999998888",
    },
  });
  assert.ok(card);

  const cardWithChecklists = await CardService.getCardById(card.id);
  assert.ok(cardWithChecklists);
  assert.ok(cardWithChecklists.checklists.length > 0);

  const mainChecklist = cardWithChecklists.checklists[0];
  const items = JSON.parse(mainChecklist.items || "[]");
  assert.ok(items.length > 0);
  assert.ok(items.some((i: any) => i.text === "Confirmar telefone de contato de teste"));

  // 3. Toggle checklist item
  const testItem = items[0];
  testItem.completed = true;
  await prisma.cardChecklist.update({
    where: { id: mainChecklist.id },
    data: { items: JSON.stringify(items) },
  });

  const updatedChecklist = await prisma.cardChecklist.findUnique({
    where: { id: mainChecklist.id },
  });
  assert.ok(updatedChecklist);
  const updatedItems = JSON.parse(updatedChecklist.items || "[]");
  assert.equal(updatedItems[0].completed, true);

  // Clean up created card & item
  await prisma.card.delete({ where: { id: card.id } }).catch(() => {});
  await prisma.checklistItem.delete({ where: { id: item.id } }).catch(() => {});
});

test("Phase Reordering with Strict Governance", async () => {
  const pipe = await prisma.pipe.findFirst({
    include: { phases: { orderBy: { order: "asc" } } },
  });
  assert.ok(pipe);
  assert.ok(pipe.phases.length >= 4);

  const initialPhases = pipe.phases;
  const firstPhase = initialPhases[0];
  const lastPhase = initialPhases[initialPhases.length - 1];
  const penultimatePhase = initialPhases[initialPhases.length - 2];

  // Verify first phase cannot be moved left
  await assert.rejects(
    async () => {
      await PipeService.movePhaseDirection(pipe.id, firstPhase.id, "left");
    },
    /imutável|não pode/i
  );

  // Verify penultimate phase cannot be moved
  await assert.rejects(
    async () => {
      await PipeService.movePhaseDirection(pipe.id, penultimatePhase.id, "left");
    },
    /imutável|não pode/i
  );

  // Verify last phase cannot be moved
  await assert.rejects(
    async () => {
      await PipeService.movePhaseDirection(pipe.id, lastPhase.id, "right");
    },
    /imutável|não pode/i
  );

  // Move intermediate phase
  const intermediatePhases = initialPhases.filter(
    (p, idx) => idx !== 0 && idx < initialPhases.length - 2
  );

  if (intermediatePhases.length >= 2) {
    const targetPhase = intermediatePhases[0];
    const reordered = await PipeService.movePhaseDirection(pipe.id, targetPhase.id, "right");
    assert.ok(reordered);
    // Boundary phases should remain at indices 0, len-2, len-1
    assert.equal(reordered[0].id, firstPhase.id);
    assert.equal(reordered[reordered.length - 1].id, lastPhase.id);
    assert.equal(reordered[reordered.length - 2].id, penultimatePhase.id);

    // Swap back
    await PipeService.movePhaseDirection(pipe.id, targetPhase.id, "left");
  }

  // Verify custom intermediate column containing 'novo' or 'fechamento' CAN be moved
  const customPhase = await prisma.phase.create({
    data: {
      pipeId: pipe.id,
      name: "Novo Contato Telefônico",
      order: 3,
      color: "#0284c7",
    },
  });

  try {
    // Should NOT throw because it is an intermediate phase, not an anchor
    const res = await PipeService.movePhaseDirection(pipe.id, customPhase.id, "right");
    assert.ok(res);
  } finally {
    await prisma.phase.delete({ where: { id: customPhase.id } }).catch(() => {});
  }
});

test("Meta Lead Ingestion Auto-Attaches Standard Checklist", async () => {
  const { processMetaLead } = await import("../src/services/metaLeadService.ts");

  const org = await prisma.organization.findFirst();
  assert.ok(org);

  // Ensure at least one standard checklist item exists
  const checklistItem = await prisma.checklistItem.create({
    data: {
      organizationId: org.id,
      title: "Verificar documentação Meta Ads",
      order: 1,
      isActive: true,
    },
  });

  const { cardId } = await processMetaLead("meta_test_leadgen_999", undefined, {
    name: "Lead Meta Com Checklist",
    phone: "11988887777",
  });

  assert.ok(cardId);
  const card = await CardService.getCardById(cardId);
  assert.ok(card);
  assert.ok(card.checklists.length > 0, "Card should have checklist auto-attached");
  const parsed = JSON.parse(card.checklists[0].items || "[]");
  assert.ok(parsed.some((i: any) => i.text === "Verificar documentação Meta Ads"));

  // Clean up
  await prisma.card.delete({ where: { id: cardId } }).catch(() => {});
  await prisma.checklistItem.delete({ where: { id: checklistItem.id } }).catch(() => {});
});
