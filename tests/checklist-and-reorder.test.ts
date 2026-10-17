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
});
