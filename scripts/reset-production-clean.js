import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function resetAllProduction() {
  console.log("=================================================================");
  console.log("   PURGA TOTAL E RECONSTRUÇÃO LIMPA DO FLOWLEADS CRM");
  console.log("=================================================================");

  // 1. Apagar tudo em cascata
  console.log("[1/6] Apagando todas as tabelas...");
  await prisma.cardAttachment.deleteMany({});
  await prisma.cardComment.deleteMany({});
  await prisma.cardActivity.deleteMany({});
  await prisma.cardChecklist.deleteMany({});
  await prisma.cardLabel.deleteMany({});
  await prisma.cardAssignee.deleteMany({});
  await prisma.cardFieldValue.deleteMany({});
  await prisma.card.deleteMany({});
  await prisma.emailOutbox.deleteMany({});
  await prisma.systemMessage.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.databaseRecord.deleteMany({});
  await prisma.databaseField.deleteMany({});
  await prisma.databaseTable.deleteMany({});
  await prisma.seller.deleteMany({});
  await prisma.store.deleteMany({});
  await prisma.checklistItem.deleteMany({});
  await prisma.field.deleteMany({});
  await prisma.phase.deleteMany({});
  await prisma.automation.deleteMany({});
  await prisma.webhook.deleteMany({});
  await prisma.pipe.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
  console.log("OK: Todas as tabelas foram zeradas com sucesso.");

  // 2. Criar única organização
  console.log("[2/6] Criando única organização oficial...");
  const org = await prisma.organization.create({
    data: {
      name: "FlowLeads - Grupo Mário Neto",
      slug: "flowleads",
    }
  });
  console.log(`OK: Organização criada: ${org.name} (${org.id})`);

  // 3. Criar as 2 lojas oficiais
  console.log("[3/6] Criando as 2 Lojas Físicas Oficiais...");
  const store1 = await prisma.store.create({
    data: {
      organizationId: org.id,
      name: "Óptica Conceição",
      description: "Unidade Matriz - Atendimento e Laboratório Óptico",
      phone: "(11) 98765-4321",
      isActive: true,
    }
  });

  const store2 = await prisma.store.create({
    data: {
      organizationId: org.id,
      name: "Óptica Mário Neto",
      description: "Unidade Filial - Atendimento Comercial Especializado",
      phone: "(11) 91234-5678",
      isActive: true,
    }
  });
  console.log(`OK: Lojas criadas: [${store1.name}] e [${store2.name}]`);

  // 4. Criar Checklist Padrão
  console.log("[4/6] Criando Checklist Padrão de Atendimento Óptico...");
  const checklistItems = [
    { title: "Identificar interesse em armações e perfil de lentes", order: 0 },
    { title: "Solicitar ou conferir receita oftálmica recente do cliente", order: 1 },
    { title: "Apresentar opções de tratamentos (Anti-reflexo, Blue UV, Fotossensível)", order: 2 },
    { title: "Agendar visita presencial na Óptica Conceição ou Mário Neto", order: 3 },
    { title: "Enviar catálogo de modelos e fotos via WhatsApp Comercial", order: 4 },
  ];
  for (const item of checklistItems) {
    await prisma.checklistItem.create({
      data: {
        organizationId: org.id,
        title: item.title,
        order: item.order,
        isActive: true,
      }
    });
  }
  console.log(`OK: 5 itens de checklist padrão cadastrados.`);

  // 5. Criar Pipe e Fases Oficiais
  console.log("[5/6] Criando Pipe e as 6 Fases do Kanban...");
  const pipe = await prisma.pipe.create({
    data: {
      organizationId: org.id,
      name: "Funil de Vendas - Leads WhatsApp & Meta",
      description: "Pipeline oficial de atendimento e conversão de leads do Grupo Mário Neto",
      icon: "Briefcase",
      color: "#0b66c3",
      publicFormSlug: "lead-grupo-mario-neto",
      isPublicFormEnabled: true,
      slaEnabled: true,
    }
  });

  const phases = [
    { name: "NOVO LEAD", color: "#3b82f6", order: 0, isFinalWon: false, isFinalLost: false },
    { name: "CONTATO INICIAL", color: "#f59e0b", order: 1, isFinalWon: false, isFinalLost: false },
    { name: "AGENDAMENTO / VISITA", color: "#8b5cf6", order: 2, isFinalWon: false, isFinalLost: false },
    { name: "EM NEGOCIAÇÃO", color: "#06b6d4", order: 3, isFinalWon: false, isFinalLost: false },
    { name: "FECHADO (GANHO)", color: "#10b981", order: 4, isFinalWon: true, isFinalLost: false },
    { name: "PERDIDO", color: "#ef4444", order: 5, isFinalWon: false, isFinalLost: true },
  ];
  for (const ph of phases) {
    await prisma.phase.create({
      data: {
        pipeId: pipe.id,
        name: ph.name,
        color: ph.color,
        order: ph.order,
        isFinalWon: ph.isFinalWon,
        isFinalLost: ph.isFinalLost,
      }
    });
  }

  const fields = [
    { label: "Nome do Lead", identifier: "nome_do_lead", type: "TEXT", isRequired: true, order: 0 },
    { label: "WhatsApp / Telefone", identifier: "whatsapp", type: "PHONE", isRequired: true, order: 1 },
    { label: "Campanha Meta Ads", identifier: "campanha_meta", type: "TEXT", isRequired: false, order: 2 },
    { label: "Grupo de Anúncios / Adset", identifier: "grupo_anuncio", type: "TEXT", isRequired: false, order: 3 },
    { label: "Criativo / Anúncio", identifier: "criativo_anuncio", type: "TEXT", isRequired: false, order: 4 },
    { label: "Valor Estimado (R$)", identifier: "valor_estimado", type: "CURRENCY", isRequired: false, order: 5 },
    { label: "Observações Comerciais", identifier: "observacoes", type: "TEXT", isRequired: false, order: 6 },
  ];
  for (const f of fields) {
    await prisma.field.create({
      data: {
        pipeId: pipe.id,
        label: f.label,
        identifier: f.identifier,
        type: f.type,
        isRequired: f.isRequired,
        order: f.order,
      }
    });
  }
  console.log(`OK: Pipe oficial e 6 fases criadas.`);

  // 6. Criar Supervisor Oficial Master
  console.log("[6/6] Criando Usuário Supervisor Geral oficial...");
  const supervisorPasswordHash = await bcrypt.hash("Supervisor@2026!", 10);
  const supervisor = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "SUPERVISOR GERAL",
      email: "supervisor@flowleads.com",
      passwordHash: supervisorPasswordHash,
      role: "SUPERVISOR",
      whatsappNumber: "(11) 99999-9999",
      monthlyTargetAmount: 200000,
      monthlyTargetDeals: 20,
      workingDaysPerMonth: 22,
      allowedMenus: "metas,kanban,reports,cadastros,automations,users",
      allowedDays: "0,1,2,3,4,5,6",
      workStartTime: "00:00",
      workEndTime: "23:59",
    }
  });

  await prisma.systemMessage.create({
    data: {
      organizationId: org.id,
      title: "🚀 Bem-vindo ao FlowLeads by Grupo Mário Neto",
      content: "Plataforma limpa e preparada para a operação comercial oficial. Supervisor: acesse o menu 'Gestão de Usuários' para cadastrar sua equipe e amarrar seus números de WhatsApp comercial aos anúncios da Meta Ads.",
      authorName: "Supervisor Geral",
      priority: "NORMAL",
    }
  });

  console.log(`OK: Supervisor cadastrado com sucesso.`);

  console.log("\n=================================================================");
  console.log("   AUDITORIA FINAL DO BANCO DE DADOS LIMPO:");
  console.log("=================================================================");
  console.log(`Organizações: ${await prisma.organization.count()}`);
  console.log(`Usuários: ${await prisma.user.count()} (${supervisor.name} - ${supervisor.email})`);
  console.log(`Lojas Físicas: ${await prisma.store.count()}`);
  console.log(`Pipes: ${await prisma.pipe.count()}`);
  console.log(`Fases no Kanban: ${await prisma.phase.count()}`);
  console.log(`Checklists Padrão: ${await prisma.checklistItem.count()}`);
  console.log(`Leads / Cards no Sistema: ${await prisma.card.count()}`);
  console.log("=================================================================");
}

resetAllProduction()
  .catch((e) => {
    console.error("Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
