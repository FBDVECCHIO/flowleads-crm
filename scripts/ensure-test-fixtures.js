import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const org = await prisma.organization.findFirst();
  const pipe = await prisma.pipe.findFirst({
    include: { phases: true }
  });
  const sdr = await prisma.user.findFirst({ where: { role: "MEMBER" } }) || await prisma.user.findFirst();
  const phaseProposal = pipe?.phases.find(p => p.order === 4) || pipe?.phases[0];

  if (!org || !pipe || !sdr || !phaseProposal) {
    console.log("Missing org, pipe, or user");
    return;
  }

  // 1. Ensure automations exist
  const existingAuto = await prisma.automation.count({ where: { pipeId: pipe.id } });
  if (existingAuto < 2) {
    await prisma.automation.create({
      data: {
        pipeId: pipe.id,
        name: "Atribuir novos leads para Carlos SDR",
        triggerType: "CARD_CREATED",
        actionType: "ASSIGN_USER",
        actionConfig: JSON.stringify({ userId: sdr.id }),
      },
    });

    await prisma.automation.create({
      data: {
        pipeId: pipe.id,
        name: "Enviar e-mail de boas-vindas ao receber proposta",
        triggerType: "CARD_MOVED",
        triggerConfig: JSON.stringify({ phaseId: phaseProposal.id }),
        actionType: "SEND_EMAIL",
        actionConfig: JSON.stringify({
          emailSubject: "Sua Proposta Comercial FlowLeads está pronta!",
          emailBody: "Olá! Acabamos de preparar sua proposta personalizada conforme alinhado em nossa reunião.",
        }),
      },
    });
    console.log("Created 2 automations");
  }

  // 2. Ensure DatabaseTable exists
  const existingTable = await prisma.databaseTable.count({ where: { organizationId: org.id } });
  if (existingTable === 0) {
    const table = await prisma.databaseTable.create({
      data: {
        organizationId: org.id,
        name: "Clientes & Contas Ativas",
        description: "Catálogo central de empresas clientes conectadas aos processos comerciais.",
      },
    });

    await prisma.databaseField.create({
      data: { tableId: table.id, label: "CNPJ", identifier: "cnpj", type: "TEXT", order: 1 },
    });
    await prisma.databaseField.create({
      data: { tableId: table.id, label: "Segmento", identifier: "segment", type: "SELECT", options: JSON.stringify(["Tecnologia", "Saúde", "Varejo", "Logística", "Serviços"]), order: 2 },
    });

    await prisma.databaseRecord.create({
      data: {
        tableId: table.id,
        title: "Varejo Prime S.A.",
        values: JSON.stringify({
          cnpj: "12.345.678/0001-90",
          segment: "Varejo",
          contact: "Beatriz Nogueira",
          mrr: "R$ 11.600,00",
        }),
      },
    });
    console.log("Created DatabaseTable and record");
  }

  await prisma.$disconnect();
}

run().catch(console.error);
