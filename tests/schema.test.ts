import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test("Database Schema & Seed Verification", async () => {
  const pipes = await prisma.pipe.findMany({
    include: {
      phases: { orderBy: { order: "asc" } },
      fields: true,
      cards: true,
      automations: true,
    },
  });

  assert.equal(pipes.length, 1);
  const pipe = pipes[0];
  assert.equal(pipe.name, "Funil de Vendas & Gestão de Leads");
  assert.equal(pipe.phases.length, 7);
  assert.equal(pipe.phases[0].name, "Novos Leads");
  assert.equal(pipe.phases[5].isFinalWon, true);
  assert.equal(pipe.phases[6].isFinalLost, true);
  assert.ok(pipe.fields.length >= 7);
  assert.ok(pipe.cards.length >= 4);
  assert.ok(pipe.automations.length >= 2);

  const users = await prisma.user.findMany();
  assert.equal(users.length, 3);

  const tables = await prisma.databaseTable.findMany({ include: { records: true } });
  assert.equal(tables.length, 1);
  assert.ok(tables[0].records.length >= 1);

  await prisma.$disconnect();
});
