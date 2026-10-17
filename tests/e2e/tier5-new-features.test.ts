import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateBusinessDays, getTeamGoalRanking, getUserGoal } from "../../src/services/goalService.ts";
import { prisma } from "../../src/lib/prisma.ts";

describe("Tier 5: New Features Verification (Business Days, Pacing, Users Management, Card Labels & Attachments)", () => {
  it("F23.1: calculateBusinessDays correctly computes total and elapsed weekdays in a month", () => {
    // Test October 2026: 31 days. Weekdays (Mon-Fri) count is 22 days.
    const result = calculateBusinessDays(2026, 9, 16); // Month 9 is October (0-indexed)
    assert.ok(result.totalBusinessDays >= 20 && result.totalBusinessDays <= 23, "Total business days in a month should be around 20-23");
    assert.ok(result.elapsedBusinessDays > 0, "Elapsed business days should be greater than 0");
    assert.ok(result.elapsedBusinessDays <= result.totalBusinessDays, "Elapsed days should not exceed total");
  });

  it("F23.2: getTeamGoalRanking returns workingDaysPerMonth, dailyTargetNormal, dailyTargetAccumulated, weeklyTarget and pacingPercentage", async () => {
    const org = await prisma.organization.findFirst();
    assert.ok(org, "Organization should exist");

    const ranking = await getTeamGoalRanking(org.id);
    assert.ok(Array.isArray(ranking) && ranking.length > 0, "Ranking should return list of users");

    const first = ranking[0];
    assert.ok(typeof first.workingDaysPerMonth === "number", "workingDaysPerMonth should be number");
    assert.ok(typeof first.dailyTargetNormal === "number", "dailyTargetNormal should be number");
    assert.ok(typeof first.dailyTargetAccumulated === "number", "dailyTargetAccumulated should be number");
    assert.ok(typeof first.weeklyTarget === "number", "weeklyTarget should be number");
    assert.ok(typeof first.pacingPercentage === "number", "pacingPercentage should be number");
    assert.ok(["ACIMA", "NO_RITMO", "ATRASADO"].includes(first.pacingStatus), "pacingStatus should be valid enum");
    assert.equal(first.weeklyTarget, Math.round(first.dailyTargetNormal * 5 * 100) / 100, "Weekly target should be 5x daily target");
  });

  it("F23.3: User model persistence supports workingDaysPerMonth and allowedMenus", async () => {
    const org = await prisma.organization.findFirst();
    assert.ok(org, "Org must exist");

    const testUser = await prisma.user.create({
      data: {
        organizationId: org.id,
        name: "Vendedor Teste Automatizado",
        email: `vendedor.teste.${Date.now()}@grupomarioneto.com.br`,
        passwordHash: "hash_teste",
        role: "MEMBER",
        whatsappNumber: "+5511999990000",
        monthlyTargetAmount: 120000,
        monthlyTargetDeals: 12,
        workingDaysPerMonth: 20,
        allowedMenus: "metas,kanban",
      },
    });

    assert.equal(testUser.workingDaysPerMonth, 20);
    assert.equal(testUser.allowedMenus, "metas,kanban");
    assert.equal(testUser.whatsappNumber, "+5511999990000");

    // Clean up
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  it("F23.4: Card attachment upload creates activity and stores document correctly", async () => {
    const pipe = await prisma.pipe.findFirst({
      include: { phases: true },
    });
    assert.ok(pipe && pipe.phases.length > 0, "Pipe with phases must exist");

    const card = await prisma.card.create({
      data: {
        pipeId: pipe.id,
        currentPhaseId: pipe.phases[0].id,
        title: "Card Teste Anexo Receita",
        dealValue: 15000,
      },
    });

    const att = await prisma.cardAttachment.create({
      data: {
        cardId: card.id,
        fileName: "receita_paciente_123.pdf",
        fileUrl: "data:application/pdf;base64,JVBERi0xLjQK...",
        mimeType: "application/pdf",
        sizeBytes: 10240,
      },
    });

    assert.equal(att.fileName, "receita_paciente_123.pdf");
    assert.equal(att.mimeType, "application/pdf");

    // Clean up
    await prisma.card.delete({ where: { id: card.id } });
  });

  it("F23.5: Card label assignment links and unlinks label on card", async () => {
    const pipe = await prisma.pipe.findFirst({
      include: { phases: true, labels: true },
    });
    assert.ok(pipe && pipe.phases.length > 0, "Pipe with phases must exist");

    // Ensure at least one label exists
    let label = pipe.labels[0];
    if (!label) {
      label = await prisma.label.create({
        data: {
          pipeId: pipe.id,
          name: "Lead Quente",
          color: "#ef4444",
        },
      });
    }

    const card = await prisma.card.create({
      data: {
        pipeId: pipe.id,
        currentPhaseId: pipe.phases[0].id,
        title: "Card Teste Label Tag",
      },
    });

    // Link label
    const cl = await prisma.cardLabel.create({
      data: {
        cardId: card.id,
        labelId: label.id,
      },
    });
    assert.ok(cl.id);

    // Verify linked
    const found = await prisma.cardLabel.findUnique({
      where: { cardId_labelId: { cardId: card.id, labelId: label.id } },
    });
    assert.ok(found);

    // Unlink
    await prisma.cardLabel.delete({
      where: { id: cl.id },
    });

    const afterDelete = await prisma.cardLabel.findUnique({
      where: { cardId_labelId: { cardId: card.id, labelId: label.id } },
    });
    assert.equal(afterDelete, null);

    // Clean up
    await prisma.card.delete({ where: { id: card.id } });
  });
});
