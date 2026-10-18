import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.ts";
import { getUserGoal, getTeamGoalRanking } from "../src/services/goalService.ts";
import { GET as getGoalsRoute } from "../src/app/api/goals/route.ts";
import { signSession, computeUserAgentFingerprint } from "../src/lib/auth.ts";

/**
 * EMPIRICAL ADVERSARIAL CHALLENGE SUITE: Milestone 2 — Goals & Attainment Engine
 *
 * Scope:
 * 1. Boundary values in goal calculations (0 deals, 100% achieved, >100% exceeded, zero target protection, negative targets).
 * 2. Data integrity: non-won cards (lost, in-progress, null currentPhase) strictly excluded from revenue attainment.
 * 3. Ranking calculation: ordering by attainment descending, secondary tie-breaker by currentAmount, sequential positions.
 * 4. getUserGoal error handling and synchronization with team ranking.
 * 5. Isolation between organizations (multi-tenant safety).
 */

test("Empirical Adversarial Challenge: Goals Attainment & Ranking Integrity (M2)", async (t) => {
  // Setup isolated test entities in database
  const testOrgA = await prisma.organization.create({
    data: {
      name: "Empresa Teste Adversarial Alpha",
      slug: `adv-org-a-${Date.now()}`,
    },
  });

  const testOrgB = await prisma.organization.create({
    data: {
      name: "Empresa Teste Adversarial Beta",
      slug: `adv-org-b-${Date.now()}`,
    },
  });

  // Create Pipe & Phases for Org A
  const testPipe = await prisma.pipe.create({
    data: {
      organizationId: testOrgA.id,
      name: "Funil Comercial Adversarial",
      publicFormSlug: `form-adv-a-${Date.now()}`,
    },
  });

  const phaseInbox = await prisma.phase.create({
    data: {
      pipeId: testPipe.id,
      name: "Fase 1: Entrada (In Progress)",
      order: 1,
      isFinalWon: false,
    },
  });

  const phaseNegotiation = await prisma.phase.create({
    data: {
      pipeId: testPipe.id,
      name: "Fase 2: Negociação (In Progress)",
      order: 2,
      isFinalWon: false,
    },
  });

  const phaseWon = await prisma.phase.create({
    data: {
      pipeId: testPipe.id,
      name: "Fase 3: Fechado Ganho (Won)",
      order: 3,
      isFinalWon: true,
    },
  });

  const phaseLost = await prisma.phase.create({
    data: {
      pipeId: testPipe.id,
      name: "Fase 4: Fechado Perdido (Lost)",
      order: 4,
      isFinalWon: false,
      isFinalLost: true,
    },
  });

  // Create Users with distinct boundary target configurations in Org A
  // User 1: Standard target (R$ 100k, 10 deals)
  const repStandard = await prisma.user.create({
    data: {
      organizationId: testOrgA.id,
      name: "Vendedora Padrão",
      email: `rep.standard.${Date.now()}@test.com`,
      passwordHash: "dummyhash",
      role: "MEMBER",
      whatsappNumber: "+5511911111111",
      monthlyTargetAmount: 100000,
      monthlyTargetDeals: 10,
    },
  });

  // User 2: Zero target boundary (0 target amount, 0 deals)
  const repZeroTarget = await prisma.user.create({
    data: {
      organizationId: testOrgA.id,
      name: "Vendedor Meta Zero",
      email: `rep.zero.${Date.now()}@test.com`,
      passwordHash: "dummyhash",
      role: "MEMBER",
      whatsappNumber: "+5511922222222",
      monthlyTargetAmount: 0,
      monthlyTargetDeals: 0,
    },
  });

  // User 3: Negative target boundary (-50k amount, -5 deals)
  const repNegativeTarget = await prisma.user.create({
    data: {
      organizationId: testOrgA.id,
      name: "Vendedor Meta Negativa",
      email: `rep.negative.${Date.now()}@test.com`,
      passwordHash: "dummyhash",
      role: "MEMBER",
      whatsappNumber: "+5511933333333",
      monthlyTargetAmount: -50000,
      monthlyTargetDeals: -5,
    },
  });

  // User 4: Null target boundary (null targets should default to 100k / 10)
  const repNullTarget = await prisma.user.create({
    data: {
      organizationId: testOrgA.id,
      name: "Vendedor Meta Null",
      email: `rep.null.${Date.now()}@test.com`,
      passwordHash: "dummyhash",
      role: "MEMBER",
      whatsappNumber: "+5511944444444",
      monthlyTargetAmount: null,
      monthlyTargetDeals: null,
    },
  });

  // User 5: Admin in Org A for RBAC testing
  const adminOrgA = await prisma.user.create({
    data: {
      organizationId: testOrgA.id,
      name: "Gestora Comercial Org A",
      email: `admin.org.a.${Date.now()}@test.com`,
      passwordHash: "dummyhash",
      role: "ADMIN",
      whatsappNumber: "+5511999990000",
      monthlyTargetAmount: 200000,
      monthlyTargetDeals: 20,
    },
  });

  // User in Org B for Tenant Isolation testing
  const repOrgB = await prisma.user.create({
    data: {
      organizationId: testOrgB.id,
      name: "Vendedor Tenant B",
      email: `rep.orgb.${Date.now()}@test.com`,
      passwordHash: "dummyhash",
      role: "MEMBER",
      whatsappNumber: "+5511955555555",
      monthlyTargetAmount: 80000,
      monthlyTargetDeals: 8,
    },
  });

  try {
    // ------------------------------------------------------------------------
    // DIMENSION 1: Boundary Values & Zero Target Protection
    // ------------------------------------------------------------------------
    await t.test("1.1 Zero Deals: Rep with 0 won deals returns clean zero metrics", async () => {
      const goal = await getUserGoal(repStandard.id);
      assert.equal(goal.currentAmount, 0, "Current amount must be 0");
      assert.equal(goal.currentDeals, 0, "Current deals count must be 0");
      assert.equal(goal.percentage, 0, "Attainment percentage must be 0%");
      assert.equal(goal.dealsPercentage, 0, "Deals percentage must be 0%");
      assert.equal(Number.isNaN(goal.percentage), false, "Percentage must not be NaN");
      assert.equal(Number.isFinite(goal.percentage), true, "Percentage must be finite");
    });

    await t.test("1.2 Zero Target Protection: targetAmount=0 and targetDeals=0 does not divide by zero", async () => {
      const goal = await getUserGoal(repZeroTarget.id);
      assert.equal(goal.targetAmount, 0);
      assert.equal(goal.targetDeals, 0);
      assert.equal(goal.percentage, 0, "Percentage must evaluate to 0 instead of NaN or Infinity");
      assert.equal(goal.dealsPercentage, 0, "Deals percentage must evaluate to 0 instead of NaN or Infinity");
      assert.equal(Number.isNaN(goal.percentage), false);
      assert.equal(Number.isFinite(goal.percentage), true);
    });

    await t.test("1.3 Negative Target Defense: targetAmount < 0 safely evaluates to 0%", async () => {
      const goal = await getUserGoal(repNegativeTarget.id);
      assert.equal(goal.targetAmount, -50000);
      assert.equal(goal.percentage, 0, "Negative target should not produce negative or invalid percentage");
      assert.equal(Number.isNaN(goal.percentage), false);
    });

    await t.test("1.4 Null Target Defaults: null monthlyTargetAmount and Deals default to 100k / 10", async () => {
      const goal = await getUserGoal(repNullTarget.id);
      assert.equal(goal.targetAmount, 100000, "Null targetAmount must default to 100000");
      assert.equal(goal.targetDeals, 10, "Null targetDeals must default to 10");
    });

    // ------------------------------------------------------------------------
    // DIMENSION 2: Phase Filtering & Data Integrity Oracles
    // ------------------------------------------------------------------------
    await t.test("2.1 Non-Won Phase Cards (Inbox, Negociação, Perdido) are strictly excluded", async () => {
      // Create non-won cards assigned to repStandard
      // Card in Inbox (order 1, isFinalWon: false)
      const c1 = await prisma.card.create({
        data: {
          pipeId: testPipe.id,
          currentPhaseId: phaseInbox.id,
          title: "Lead Entrada Teste",
          dealValue: 50000,
        },
      });
      await prisma.cardAssignee.create({ data: { cardId: c1.id, userId: repStandard.id } });

      // Card in Negotiation (order 2, isFinalWon: false)
      const c2 = await prisma.card.create({
        data: {
          pipeId: testPipe.id,
          currentPhaseId: phaseNegotiation.id,
          title: "Lead Negociação Teste",
          dealValue: 30000,
        },
      });
      await prisma.cardAssignee.create({ data: { cardId: c2.id, userId: repStandard.id } });

      // Card in Lost (order 4, isFinalLost: true, isFinalWon: false)
      const c3 = await prisma.card.create({
        data: {
          pipeId: testPipe.id,
          currentPhaseId: phaseLost.id,
          title: "Lead Perdido Teste",
          dealValue: 70000,
        },
      });
      await prisma.cardAssignee.create({ data: { cardId: c3.id, userId: repStandard.id } });

      // Check repStandard's goal: despite R$ 150.000 in pipeline/lost, won metrics must be 0!
      const goal = await getUserGoal(repStandard.id);
      assert.equal(goal.currentAmount, 0, "Non-won cards must NEVER increment currentAmount");
      assert.equal(goal.currentDeals, 0, "Non-won cards must NEVER increment currentDeals");
      assert.equal(goal.percentage, 0, "Percentage must remain 0%");
    });

    await t.test("2.2 Exactly 100% Attainment: Won deal matching target achieves 100%", async () => {
      // Create a won deal of exactly R$ 100.000
      const cWon100k = await prisma.card.create({
        data: {
          pipeId: testPipe.id,
          currentPhaseId: phaseWon.id,
          title: "Contrato Fechado 100k",
          dealValue: 100000,
        },
      });
      await prisma.cardAssignee.create({ data: { cardId: cWon100k.id, userId: repStandard.id } });

      const goal = await getUserGoal(repStandard.id);
      assert.equal(goal.currentAmount, 100000, "Current amount must equal 100.000");
      assert.equal(goal.currentDeals, 1, "Current deals must equal 1");
      assert.equal(goal.percentage, 100, "Percentage must be exactly 100.0%");
      assert.equal(goal.dealsPercentage, 10, "1 of 10 deals = 10%");
    });

    await t.test("2.3 Over-Attainment (>100% and >120% Supermeta): High revenue exceeds 100%", async () => {
      // Add another won deal of R$ 50.000 (total R$ 150.000 -> 150%)
      const cWon50k = await prisma.card.create({
        data: {
          pipeId: testPipe.id,
          currentPhaseId: phaseWon.id,
          title: "Contrato Adicional 50k",
          dealValue: 50000,
        },
      });
      await prisma.cardAssignee.create({ data: { cardId: cWon50k.id, userId: repStandard.id } });

      const goal = await getUserGoal(repStandard.id);
      assert.equal(goal.currentAmount, 150000);
      assert.equal(goal.currentDeals, 2);
      assert.equal(goal.percentage, 150, "Percentage must reflect 150%");
    });

    await t.test("2.4 Won Deal with Null or Zero dealValue: safely handled without NaN", async () => {
      // Won deal with dealValue = null
      const cNullVal = await prisma.card.create({
        data: {
          pipeId: testPipe.id,
          currentPhaseId: phaseWon.id,
          title: "Contrato Sem Valor Definido",
          dealValue: null,
        },
      });
      await prisma.cardAssignee.create({ data: { cardId: cNullVal.id, userId: repNullTarget.id } });

      // Won deal with dealValue = 0
      const cZeroVal = await prisma.card.create({
        data: {
          pipeId: testPipe.id,
          currentPhaseId: phaseWon.id,
          title: "Contrato Valor Zero",
          dealValue: 0,
        },
      });
      await prisma.cardAssignee.create({ data: { cardId: cZeroVal.id, userId: repNullTarget.id } });

      const goal = await getUserGoal(repNullTarget.id);
      assert.equal(goal.currentAmount, 0, "Sum of null and 0 deal values must be 0");
      assert.equal(goal.currentDeals, 2, "Two won deals counted");
      assert.equal(goal.percentage, 0, "0% revenue attainment");
      assert.equal(goal.dealsPercentage, 20, "2 of 10 deals = 20%");
      assert.equal(Number.isNaN(goal.currentAmount), false);
    });

    await t.test("2.5 Floating Point Centavos Precision: 2 decimal places rounding", async () => {
      // repStandard adds a deal with 33.333... percentage impact
      // Let's create a rep with target 300
      const repFloat = await prisma.user.create({
        data: {
          organizationId: testOrgA.id,
          name: "Vendedor Ponto Flutuante",
          email: `rep.float.${Date.now()}@test.com`,
          passwordHash: "dummyhash",
          role: "MEMBER",
          monthlyTargetAmount: 300,
          monthlyTargetDeals: 3,
        },
      });
      const cFloat = await prisma.card.create({
        data: {
          pipeId: testPipe.id,
          currentPhaseId: phaseWon.id,
          title: "Contrato 100 de 300",
          dealValue: 100,
        },
      });
      await prisma.cardAssignee.create({ data: { cardId: cFloat.id, userId: repFloat.id } });

      const goal = await getUserGoal(repFloat.id);
      // 100 / 300 * 100 = 33.333333333333336 -> should round to 33.33
      assert.equal(goal.percentage, 33.33, "Percentage must round cleanly to 33.33 without float trailing artifacts");
    });

    await t.test("2.6 Orphan Card Defense: Unassigned won deals do not attribute to any user", async () => {
      const cOrphan = await prisma.card.create({
        data: {
          pipeId: testPipe.id,
          currentPhaseId: phaseWon.id,
          title: "Contrato Orfão Sem Vendedor",
          dealValue: 999999,
        },
      });
      // No cardAssignee created!

      // Check repNegativeTarget who has 0 deals
      const goal = await getUserGoal(repNegativeTarget.id);
      assert.equal(goal.currentAmount, 0, "Orphan card must not be attributed");
      assert.equal(goal.currentDeals, 0);
    });

    // ------------------------------------------------------------------------
    // DIMENSION 3: Ranking Engine, Ordering & Tie-Breaking
    // ------------------------------------------------------------------------
    await t.test("3.1 Ranking Ordering: Higher attainment percentage ranks above lower", async () => {
      const ranking = await getTeamGoalRanking(testOrgA.id);
      assert.ok(ranking.length >= 4, "Must return all users in Org A");

      // Verify strictly descending order by percentage
      for (let i = 0; i < ranking.length - 1; i++) {
        const current = ranking[i];
        const next = ranking[i + 1];
        assert.ok(
          current.percentage >= next.percentage,
          `Ranking order violation: #${current.rankingPosition} (${current.userName}: ${current.percentage}%) should be >= #${next.rankingPosition} (${next.userName}: ${next.percentage}%)`
        );
      }
    });

    await t.test("3.2 Secondary Tie-Breaker: When percentage is tied, higher currentAmount wins", async () => {
      // Create Org C with two reps having exactly 100% attainment but different revenue
      const testOrgC = await prisma.organization.create({
        data: {
          name: "Empresa Teste Tie-Breaker",
          slug: `adv-org-c-${Date.now()}`,
        },
      });

      const pipeC = await prisma.pipe.create({
        data: { organizationId: testOrgC.id, name: "Pipe C", publicFormSlug: `form-adv-c-${Date.now()}` },
      });
      const phaseWonC = await prisma.phase.create({
        data: { pipeId: pipeC.id, name: "Won C", isFinalWon: true, order: 1 },
      });

      // Rep A: Target 100k, won 100k -> 100%
      const repA = await prisma.user.create({
        data: {
          organizationId: testOrgC.id,
          name: "Rep High Volume (100k)",
          email: `rep.a.${Date.now()}@test.com`,
          passwordHash: "dummy",
          monthlyTargetAmount: 100000,
          monthlyTargetDeals: 1,
        },
      });
      const cardA = await prisma.card.create({
        data: { pipeId: pipeC.id, currentPhaseId: phaseWonC.id, title: "Deal 100k", dealValue: 100000 },
      });
      await prisma.cardAssignee.create({ data: { cardId: cardA.id, userId: repA.id } });

      // Rep B: Target 50k, won 50k -> 100%
      const repB = await prisma.user.create({
        data: {
          organizationId: testOrgC.id,
          name: "Rep Lower Volume (50k)",
          email: `rep.b.${Date.now()}@test.com`,
          passwordHash: "dummy",
          monthlyTargetAmount: 50000,
          monthlyTargetDeals: 1,
        },
      });
      const cardB = await prisma.card.create({
        data: { pipeId: pipeC.id, currentPhaseId: phaseWonC.id, title: "Deal 50k", dealValue: 50000 },
      });
      await prisma.cardAssignee.create({ data: { cardId: cardB.id, userId: repB.id } });

      const rankingC = await getTeamGoalRanking(testOrgC.id);
      assert.equal(rankingC.length, 2);
      assert.equal(rankingC[0].percentage, 100);
      assert.equal(rankingC[1].percentage, 100);

      // Rep A with 100k must break the tie over Rep B with 50k!
      assert.equal(rankingC[0].userId, repA.id, "Rep with R$ 100.000 must rank 1st over Rep with R$ 50.000");
      assert.equal(rankingC[0].rankingPosition, 1);
      assert.equal(rankingC[1].userId, repB.id, "Rep with R$ 50.000 must rank 2nd");
      assert.equal(rankingC[1].rankingPosition, 2);
    });

    await t.test("3.3 Primary Criterion Dominance: Higher percentage always beats higher absolute revenue", async () => {
      // Rep with 90% of 10k (9k) must rank ABOVE Rep with 80% of 1,000,000 (800k)
      const testOrgD = await prisma.organization.create({
        data: {
          name: "Empresa Teste Dominance",
          slug: `adv-org-d-${Date.now()}`,
        },
      });
      const pipeD = await prisma.pipe.create({
        data: { organizationId: testOrgD.id, name: "Pipe D", publicFormSlug: `form-adv-d-${Date.now()}` },
      });
      const phaseWonD = await prisma.phase.create({
        data: { pipeId: pipeD.id, name: "Won D", isFinalWon: true, order: 1 },
      });

      const repHighPct = await prisma.user.create({
        data: {
          organizationId: testOrgD.id,
          name: "Rep Alta Porcentagem",
          email: `rep.highpct.${Date.now()}@test.com`,
          passwordHash: "dummy",
          monthlyTargetAmount: 10000,
          monthlyTargetDeals: 1,
        },
      });
      const cardHigh = await prisma.card.create({
        data: { pipeId: pipeD.id, currentPhaseId: phaseWonD.id, title: "Deal 9k", dealValue: 9000 },
      });
      await prisma.cardAssignee.create({ data: { cardId: cardHigh.id, userId: repHighPct.id } });

      const repHighRev = await prisma.user.create({
        data: {
          organizationId: testOrgD.id,
          name: "Rep Alta Receita Absoluta",
          email: `rep.highrev.${Date.now()}@test.com`,
          passwordHash: "dummy",
          monthlyTargetAmount: 1000000,
          monthlyTargetDeals: 1,
        },
      });
      const cardRev = await prisma.card.create({
        data: { pipeId: pipeD.id, currentPhaseId: phaseWonD.id, title: "Deal 800k", dealValue: 800000 },
      });
      await prisma.cardAssignee.create({ data: { cardId: cardRev.id, userId: repHighRev.id } });

      const rankingD = await getTeamGoalRanking(testOrgD.id);
      assert.equal(rankingD[0].userId, repHighPct.id, "90% attainment rep must rank #1");
      assert.equal(rankingD[0].rankingPosition, 1);
      assert.equal(rankingD[1].userId, repHighRev.id, "80% attainment rep must rank #2");
      assert.equal(rankingD[1].rankingPosition, 2);
    });

    await t.test("3.4 Sequential Ranking Positions: No gaps and 1-based indexing", async () => {
      const ranking = await getTeamGoalRanking(testOrgA.id);
      for (let i = 0; i < ranking.length; i++) {
        assert.equal(ranking[i].rankingPosition, i + 1, `Position index at ${i} must equal ${i + 1}`);
      }
    });

    // ------------------------------------------------------------------------
    // DIMENSION 4: Tenant Isolation & Multi-Organization Boundary
    // ------------------------------------------------------------------------
    await t.test("4.1 Tenant Boundary Isolation: Org A ranking never includes Org B users", async () => {
      const rankingA = await getTeamGoalRanking(testOrgA.id);
      const orgBUserInA = rankingA.find((r) => r.userId === repOrgB.id);
      assert.equal(orgBUserInA, undefined, "Org B user must never appear in Org A team ranking");

      const rankingB = await getTeamGoalRanking(testOrgB.id);
      assert.equal(rankingB.length, 1, "Org B ranking must only contain Org B users");
      assert.equal(rankingB[0].userId, repOrgB.id);
    });

    // ------------------------------------------------------------------------
    // DIMENSION 5: User Goal Direct Query & Error Handling
    // ------------------------------------------------------------------------
    await t.test("5.1 getUserGoal syncs with getTeamGoalRanking rankingPosition", async () => {
      const ranking = await getTeamGoalRanking(testOrgA.id);
      for (const item of ranking) {
        const directUserGoal = await getUserGoal(item.userId);
        assert.equal(
          directUserGoal.rankingPosition,
          item.rankingPosition,
          `getUserGoal rankingPosition for ${item.userName} must match getTeamGoalRanking`
        );
        assert.equal(directUserGoal.currentAmount, item.currentAmount);
        assert.equal(directUserGoal.percentage, item.percentage);
      }
    });

    await t.test("5.2 Non-Existent User ID throws descriptive error", async () => {
      let threw = false;
      try {
        await getUserGoal("non_existent_cuid_123456789");
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes("User with ID non_existent_cuid_123456789 not found"));
      }
      assert.equal(threw, true, "Must throw when user ID does not exist");
    });

    // ------------------------------------------------------------------------
    // DIMENSION 6: API Route (/api/goals) RBAC & Edge Cases
    // ------------------------------------------------------------------------
    await t.test("6.1 Member API Isolation: Standard GET /api/goals hides teamRanking from MEMBER", async () => {
      const ua = "FlowLeadsTestAgent/1.0";
      const token = signSession({
        userId: repStandard.id,
        email: repStandard.email,
        name: repStandard.name,
        role: "MEMBER",
        organizationId: testOrgA.id,
        fingerprint: computeUserAgentFingerprint(ua),
        issuedAt: Date.now(),
      });

      const req = new Request("http://localhost/api/goals", {
        headers: {
          cookie: `flowleads_session=${token}`,
          "user-agent": ua,
        },
      });

      const res = await getGoalsRoute(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.isSupervisor, false, "Member must not be marked as supervisor");
      assert.equal(data.teamRanking, null, "Standard member request must have null teamRanking");
      assert.equal(data.userGoal.userId, repStandard.id);
    });

    await t.test("6.2 Supervisor API Access: GET /api/goals returns full teamRanking for ADMIN", async () => {
      const ua = "FlowLeadsTestAgent/1.0";
      const token = signSession({
        userId: adminOrgA.id,
        email: adminOrgA.email,
        name: adminOrgA.name,
        role: "ADMIN",
        organizationId: testOrgA.id,
        fingerprint: computeUserAgentFingerprint(ua),
        issuedAt: Date.now(),
      });

      const req = new Request("http://localhost/api/goals", {
        headers: {
          cookie: `flowleads_session=${token}`,
          "user-agent": ua,
        },
      });

      const res = await getGoalsRoute(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.isSupervisor, true, "Admin must be marked as supervisor");
      assert.ok(Array.isArray(data.teamRanking), "teamRanking must be populated for Admin");
      assert.ok(data.teamRanking.length >= 4);
    });

    await t.test("6.3 Secured: includeRanking parameter does not expose teamRanking to MEMBER", async () => {
      const ua = "FlowLeadsTestAgent/1.0";
      const token = signSession({
        userId: repStandard.id,
        email: repStandard.email,
        name: repStandard.name,
        role: "MEMBER",
        organizationId: testOrgA.id,
        fingerprint: computeUserAgentFingerprint(ua),
        issuedAt: Date.now(),
      });

      const req = new Request("http://localhost/api/goals?includeRanking=true", {
        headers: {
          cookie: `flowleads_session=${token}`,
          "user-agent": ua,
        },
      });

      const res = await getGoalsRoute(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.teamRanking, null, "Secured: Member request with includeRanking=true must NOT expose team ranking");
      assert.equal(data.isSupervisor, false);
    });

    await t.test("6.4 Secured: userId parameter does not allow cross-user goal inspection for MEMBER", async () => {
      const ua = "FlowLeadsTestAgent/1.0";
      const token = signSession({
        userId: repStandard.id,
        email: repStandard.email,
        name: repStandard.name,
        role: "MEMBER",
        organizationId: testOrgA.id,
        fingerprint: computeUserAgentFingerprint(ua),
        issuedAt: Date.now(),
      });

      // Member queries admin's goal directly via ?userId=...
      const req = new Request(`http://localhost/api/goals?userId=${adminOrgA.id}`, {
        headers: {
          cookie: `flowleads_session=${token}`,
          "user-agent": ua,
        },
      });

      const res = await getGoalsRoute(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      // Secured: MEMBER cannot inspect other users' goals; their own metrics are returned
      assert.equal(data.userGoal.userId, repStandard.id, "Secured: Member cannot inspect other users goals via userId parameter");
    });

    await t.test("6.5 Negative Deal Value: Won deal with negative value decrements currentAmount safely", async () => {
      // Won deal with dealValue = -10000 (refund)
      const cRefund = await prisma.card.create({
        data: {
          pipeId: testPipe.id,
          currentPhaseId: phaseWon.id,
          title: "Estorno de Contrato",
          dealValue: -10000,
        },
      });
      await prisma.cardAssignee.create({ data: { cardId: cRefund.id, userId: repStandard.id } });

      const goal = await getUserGoal(repStandard.id);
      // Previous won: 100k + 50k = 150k. Now minus 10k = 140k. Target 100k -> 140%
      assert.equal(goal.currentAmount, 140000, "Current amount must reflect subtraction of refund");
      assert.equal(goal.percentage, 140, "Percentage must recalculate cleanly");
      assert.equal(Number.isNaN(goal.percentage), false);
    });
  } finally {
    // Cleanup isolated test data
    const advOrgs = await prisma.organization.findMany({ where: { slug: { startsWith: "adv-org-" } } });
    const orgIds = advOrgs.map((o) => o.id);
    // Find pipes and users created for cleanup
    const pipes = await prisma.pipe.findMany({ where: { organizationId: { in: orgIds } } });
    const pipeIds = pipes.map((p) => p.id);

    const cards = await prisma.card.findMany({ where: { pipeId: { in: pipeIds } } });
    const cardIds = cards.map((c) => c.id);

    await prisma.cardAssignee.deleteMany({ where: { cardId: { in: cardIds } } });
    await prisma.card.deleteMany({ where: { id: { in: cardIds } } });
    await prisma.phase.deleteMany({ where: { pipeId: { in: pipeIds } } });
    await prisma.pipe.deleteMany({ where: { id: { in: pipeIds } } });
    await prisma.user.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  }
});
