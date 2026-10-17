import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do FlowLeads CRM...");

  const force = process.argv.includes("--force");
  const existingOrg = await prisma.organization.findFirst();

  if (existingOrg && !force) {
    console.log("Banco de dados já populado. Pulando seed para preservar integridade dos dados existentes.");
    return;
  }

  // 1. Limpar banco existente se explicitamente requisitado
  await prisma.systemMessage.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.store.deleteMany();
  await prisma.cardAttachment.deleteMany();
  await prisma.emailOutbox.deleteMany();
  await prisma.webhook.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.cardActivity.deleteMany();
  await prisma.cardComment.deleteMany();
  await prisma.cardChecklist.deleteMany();
  await prisma.cardLabel.deleteMany();
  await prisma.cardAssignee.deleteMany();
  await prisma.cardFieldValue.deleteMany();
  await prisma.card.deleteMany();
  await prisma.field.deleteMany();
  await prisma.label.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.pipe.deleteMany();
  await prisma.databaseRecord.deleteMany();
  await prisma.databaseField.deleteMany();
  await prisma.databaseTable.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 2. Criar Organizacao
  const org = await prisma.organization.create({
    data: {
      name: "Grupo Mário Neto",
      slug: "grupo-mario-neto",
    },
  });

  // 2.1 Cadastros: Lojas Físicas de Ótica
  const storeMatriz = await prisma.store.create({
    data: {
      organizationId: org.id,
      name: "Ótica Centro - Matriz",
      description: "Rua Direita, 120, Centro - SP. Atendimento premium e laboratório próprio.",
      phone: "+551132145500",
      isActive: true,
    },
  });

  const storeShoppingSul = await prisma.store.create({
    data: {
      organizationId: org.id,
      name: "Ótica Shopping Sul",
      description: "Av. das Nações, 500, Loja 42, Shopping Sul. Aberto seg a sab até 22h.",
      phone: "+551133458800",
      isActive: true,
    },
  });

  const storeNortePlaza = await prisma.store.create({
    data: {
      organizationId: org.id,
      name: "Ótica Norte Plaza",
      description: "Av. Brasil, 1500, Loja 110, Norte Plaza. Amplo estacionamento e consultório credenciado.",
      phone: "+551134569900",
      isActive: true,
    },
  });

  // 2.2 Cadastros: Vendedores e Captadores
  await prisma.seller.createMany({
    data: [
      {
        organizationId: org.id,
        storeId: storeMatriz.id,
        name: "Lucas Ferreira",
        role: "VENDEDOR",
        phone: "+5511981112222",
        isActive: true,
      },
      {
        organizationId: org.id,
        storeId: storeMatriz.id,
        name: "Juliana Mendes",
        role: "CAPTADOR",
        phone: "+5511982223333",
        isActive: true,
      },
      {
        organizationId: org.id,
        storeId: storeShoppingSul.id,
        name: "Roberto Rocha",
        role: "VENDEDOR",
        phone: "+5511983334444",
        isActive: true,
      },
      {
        organizationId: org.id,
        storeId: storeShoppingSul.id,
        name: "Aline Souza",
        role: "CAPTADOR",
        phone: "+5511984445555",
        isActive: true,
      },
      {
        organizationId: org.id,
        storeId: storeNortePlaza.id,
        name: "Fernando Dias",
        role: "VENDEDOR",
        phone: "+5511985556666",
        isActive: true,
      },
    ],
  });

  // 2.3 Cadastros: Campanhas Meta Ads / Marketing
  await prisma.campaign.create({
    data: {
      organizationId: org.id,
      name: "Campanha Óculos Completo 2026",
      description: "Armação de acetato ou titânio + lentes visão simples com antirreflexo.",
      imageUrl: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&q=80",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      products: "armação, lente, óculos completo",
      eligibleStores: JSON.stringify([storeMatriz.id, storeShoppingSul.id, storeNortePlaza.id]),
      isActive: true,
    },
  });

  await prisma.campaign.create({
    data: {
      organizationId: org.id,
      name: "Campanha Lentes Digitais Anti-Blue",
      description: "Lentes com filtro de luz azul para proteção em telas e escritório.",
      imageUrl: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=400&q=80",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-12-31"),
      products: "lente, óculos completo",
      eligibleStores: JSON.stringify([storeMatriz.id, storeShoppingSul.id]),
      isActive: true,
    },
  });

  await prisma.campaign.create({
    data: {
      organizationId: org.id,
      name: "Campanha Armações Solares Verão",
      description: "Armações solares com proteção UV400 com ou sem graduação.",
      imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-11-30"),
      products: "armação",
      eligibleStores: JSON.stringify([storeMatriz.id, storeNortePlaza.id]),
      isActive: true,
    },
  });

  // 2.4 Cadastros: Mensagens e Comunicados da Central (visíveis no Sino)
  await prisma.systemMessage.create({
    data: {
      organizationId: org.id,
      title: "Boas-vindas à Central FlowLeads Óticas",
      content: "Central de atendimento ativa para distribuição de leads nas lojas físicas. Registre a OS e a data da visita assim que o cliente confirmar.",
      authorName: "Supervisor Geral",
      priority: "NORMAL",
    },
  });

  await prisma.systemMessage.create({
    data: {
      organizationId: org.id,
      title: "Urgente: Foco na Campanha Óculos Completo",
      content: "Atenção consultores: prioridade de agendamento para os leads da Campanha Óculos Completo 2026 nas lojas Centro e Shopping Sul.",
      authorName: "Gerência Comercial",
      priority: "URGENTE",
    },
  });

  // 3. Criar Usuarios com bcrypt 12 salt rounds
  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);

  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Gestor Comercial (Admin)",
      email: "admin@flowleads.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      whatsappNumber: "+5511988887777",
      monthlyTargetAmount: 150000,
      monthlyTargetDeals: 15,
      workingDaysPerMonth: 22,
      allowedMenus: "metas,kanban,reports,automations,users",
      allowedDays: "1,2,3,4,5",
      workStartTime: "08:00",
      workEndTime: "18:00",
    },
  });

  const sdr = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Carlos SDR",
      email: "carlos@flowleads.com",
      passwordHash: userPassword,
      role: "MEMBER",
      whatsappNumber: "+5511999999999",
      monthlyTargetAmount: 200000,
      monthlyTargetDeals: 10,
      workingDaysPerMonth: 22,
      allowedMenus: "metas,kanban,reports",
      allowedDays: "1,2,3,4,5",
      workStartTime: "08:00",
      workEndTime: "18:00",
    },
  });

  const closer = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Mariana Closer",
      email: "mariana@flowleads.com",
      passwordHash: userPassword,
      role: "MEMBER",
      whatsappNumber: "+5511977776666",
      monthlyTargetAmount: 150000,
      monthlyTargetDeals: 8,
      workingDaysPerMonth: 22,
      allowedMenus: "metas,kanban,reports",
      allowedDays: "1,2,3,4,5",
      workStartTime: "08:00",
      workEndTime: "18:00",
    },
  });

  // 4. Criar Pipe: Funil de Vendas e Leads
  const pipe = await prisma.pipe.create({
    data: {
      organizationId: org.id,
      name: "Funil de Vendas & Gestão de Leads",
      description: "Pipeline comercial FlowLeads com qualificação BANT, controle de SLA e automações.",
      icon: "TrendingUp",
      color: "#0b66c3",
      isPublicFormEnabled: true,
      publicFormSlug: "crm-vendas",
      slaEnabled: true,
    },
  });

  // 5. Criar Fases do Pipe
  const phaseInbox = await prisma.phase.create({
    data: {
      pipeId: pipe.id,
      name: "Novos Leads",
      description: "Leads recém-chegados aguardando primeiro contato do SDR",
      order: 1,
      color: "#64748b",
      slaHours: 24,
      wipLimit: 30,
    },
  });

  const phaseQualify = await prisma.phase.create({
    data: {
      pipeId: pipe.id,
      name: "Qualificação (SDR)",
      description: "Identificação de perfil de cliente ideal e BANT",
      order: 2,
      color: "#0b66c3",
      slaHours: 48,
      wipLimit: 20,
    },
  });

  const phaseMeeting = await prisma.phase.create({
    data: {
      pipeId: pipe.id,
      name: "Reunião / Demo",
      description: "Apresentação de solução e diagnóstico",
      order: 3,
      color: "#8b5cf6",
      slaHours: 72,
      wipLimit: 15,
    },
  });

  const phaseProposal = await prisma.phase.create({
    data: {
      pipeId: pipe.id,
      name: "Proposta Enviada",
      description: "Elaboração e envio de proposta comercial formal",
      order: 4,
      color: "#f59e0b",
      slaHours: 96,
      wipLimit: 15,
    },
  });

  const phaseNegotiation = await prisma.phase.create({
    data: {
      pipeId: pipe.id,
      name: "Negociação",
      description: "Ajuste de escopo, prazos e condições financeiras",
      order: 5,
      color: "#ec4899",
      slaHours: 48,
      wipLimit: 10,
    },
  });

  const phaseWon = await prisma.phase.create({
    data: {
      pipeId: pipe.id,
      name: "Fechado Ganho",
      description: "Negócio fechado e enviado para Onboarding",
      order: 6,
      color: "#10b981",
      isFinalWon: true,
    },
  });

  const phaseLost = await prisma.phase.create({
    data: {
      pipeId: pipe.id,
      name: "Fechado Perdido",
      description: "Oportunidade perdida com registro do motivo",
      order: 7,
      color: "#ef4444",
      isFinalLost: true,
    },
  });

  // 6. Campos Globais do Start Form (Entrada de Lead)
  const fieldLeadName = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Nome do Contato",
      identifier: "lead_name",
      type: "TEXT",
      isRequired: true,
      placeholder: "Ex: João Silva",
      order: 1,
    },
  });

  const fieldLeadEmail = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "E-mail Corporativo",
      identifier: "lead_email",
      type: "EMAIL",
      isRequired: true,
      placeholder: "joao@empresa.com",
      order: 2,
    },
  });

  const fieldLeadPhone = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Telefone / WhatsApp",
      identifier: "lead_phone",
      type: "PHONE",
      isRequired: true,
      placeholder: "(11) 98765-4321",
      order: 3,
    },
  });

  const fieldCompany = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Nome da Empresa",
      identifier: "company_name",
      type: "TEXT",
      isRequired: true,
      placeholder: "Ex: MegaTech Indústria",
      order: 4,
    },
  });

  const fieldOrigin = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Origem do Lead",
      identifier: "lead_origin",
      type: "SELECT",
      options: JSON.stringify(["Formulário Web", "Inbound Marketing", "Indicação", "Outbound / SDR", "LinkedIn Ads"]),
      isRequired: false,
      order: 5,
    },
  });

  const fieldDealValue = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Valor Estimado (R$)",
      identifier: "deal_value",
      type: "CURRENCY",
      isRequired: false,
      placeholder: "0,00",
      order: 6,
    },
  });

  const fieldNeed = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Necessidade / Projeto",
      identifier: "lead_need",
      type: "TEXTAREA",
      placeholder: "Descreva a dor ou objetivo principal do lead...",
      order: 7,
    },
  });

  // Campos específicos de Óticas e Distribuição para Lojas Físicas
  const fieldLeadDate = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Data do Contato",
      identifier: "lead_date",
      type: "DATE",
      order: 8,
    },
  });

  const fieldCampaign = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Campanha de Interesse",
      identifier: "campaign_interest",
      type: "SELECT",
      options: JSON.stringify([
        "Campanha Óculos Completo 2026",
        "Campanha Lentes Digitais Anti-Blue",
        "Campanha Armações Solares Verão"
      ]),
      order: 9,
    },
  });

  const fieldStore = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Loja Negociada",
      identifier: "store_negotiated",
      type: "SELECT",
      options: JSON.stringify([
        "Ótica Centro - Matriz",
        "Ótica Shopping Sul",
        "Ótica Norte Plaza"
      ]),
      order: 10,
    },
  });

  const fieldEstimatedVisit = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Data e Horário Estimada da Visita",
      identifier: "estimated_visit_datetime",
      type: "TEXT",
      placeholder: "Ex: 2026-10-20 15:30",
      order: 11,
    },
  });

  const fieldOsNumber = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Número da OS",
      identifier: "os_number",
      type: "TEXT",
      placeholder: "Ex: OS-2026-0941",
      order: 12,
    },
  });

  const fieldSaleDate = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Data da Venda",
      identifier: "sale_date",
      type: "DATE",
      order: 13,
    },
  });

  const fieldSaleAmount = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Valor Final da Venda (R$)",
      identifier: "sale_amount",
      type: "CURRENCY",
      order: 14,
    },
  });

  const fieldSeller = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      label: "Vendedor que Atendeu",
      identifier: "seller_name",
      type: "SELECT",
      options: JSON.stringify([
        "Lucas Ferreira",
        "Juliana Mendes",
        "Roberto Rocha",
        "Aline Souza",
        "Fernando Dias"
      ]),
      order: 15,
    },
  });

  // Campos específicos de fases (Phase Fields)
  const fieldBantBudget = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      phaseId: phaseQualify.id,
      label: "Orçamento Validado (Budget)",
      identifier: "bant_budget",
      type: "SELECT",
      options: JSON.stringify(["Até R$ 5.000/mês", "R$ 5.000 a R$ 20.000/mês", "Acima de R$ 20.000/mês"]),
      isRequired: true,
      order: 1,
    },
  });

  const fieldMeetingDate = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      phaseId: phaseMeeting.id,
      label: "Data da Reunião",
      identifier: "meeting_date",
      type: "DATE",
      isRequired: true,
      order: 1,
    },
  });

  const fieldPaymentTerms = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      phaseId: phaseProposal.id,
      label: "Condição de Pagamento",
      identifier: "payment_terms",
      type: "SELECT",
      options: JSON.stringify(["Mensal recorrente", "Anual à vista (15% desconto)", "Trimestral"]),
      isRequired: true,
      order: 1,
    },
  });

  const fieldLossReason = await prisma.field.create({
    data: {
      pipeId: pipe.id,
      phaseId: phaseLost.id,
      label: "Motivo da Perda",
      identifier: "loss_reason",
      type: "SELECT",
      options: JSON.stringify(["Preço fora do budget", "Falta de feature essencial", "Optou por concorrente", "Projeto congelado", "Sem contato pós-proposta"]),
      isRequired: true,
      order: 1,
    },
  });

  // 7. Labels / Etiquetas
  const labelHot = await prisma.label.create({
    data: { pipeId: pipe.id, name: "Lead Quente 🔥", color: "#ef4444" },
  });
  const labelWarm = await prisma.label.create({
    data: { pipeId: pipe.id, name: "Interesse Médio", color: "#f59e0b" },
  });
  const labelEnterprise = await prisma.label.create({
    data: { pipeId: pipe.id, name: "Enterprise 🏢", color: "#8b5cf6" },
  });

  // 8. Automações
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

  // 9. Webhook inicial
  await prisma.webhook.create({
    data: {
      pipeId: pipe.id,
      name: "Webhook Integração CRM (Zapier/Make)",
      url: "https://api.meusistema.com/webhook/flowleads",
      events: JSON.stringify(["card.created", "card.moved", "card.won"]),
      isActive: true,
    },
  });

  // 10. Cards Iniciais com dados ricos
  const card1 = await prisma.card.create({
    data: {
      pipeId: pipe.id,
      currentPhaseId: phaseInbox.id,
      title: "TechCorp Brasil - Expansão de Operação Comercial",
      dealValue: 48000,
      priority: "HIGH",
      dueDate: new Date(Date.now() + 86400000 * 2), // daqui 2 dias
      createdById: admin.id,
    },
  });

  await prisma.cardFieldValue.createMany({
    data: [
      { cardId: card1.id, fieldId: fieldLeadName.id, value: "Rodrigo Almeida" },
      { cardId: card1.id, fieldId: fieldLeadEmail.id, value: "rodrigo@techcorp.com.br" },
      { cardId: card1.id, fieldId: fieldLeadPhone.id, value: "(11) 98822-1100" },
      { cardId: card1.id, fieldId: fieldCompany.id, value: "TechCorp Brasil" },
      { cardId: card1.id, fieldId: fieldOrigin.id, value: "Formulário Web" },
      { cardId: card1.id, fieldId: fieldDealValue.id, value: "48000" },
      { cardId: card1.id, fieldId: fieldNeed.id, value: "Precisam substituir planilhas por um CRM estruturado estilo FlowLeads para 25 corretores." },
    ],
  });

  await prisma.cardAssignee.create({ data: { cardId: card1.id, userId: sdr.id } });
  await prisma.cardLabel.create({ data: { cardId: card1.id, labelId: labelHot.id } });
  await prisma.cardLabel.create({ data: { cardId: card1.id, labelId: labelEnterprise.id } });

  await prisma.cardChecklist.create({
    data: {
      cardId: card1.id,
      title: "Triagem do SDR",
      items: JSON.stringify([
        { id: "1", text: "Verificar site da empresa e LinkedIn", completed: true },
        { id: "2", text: "Primeiro contato telefônico ou WhatsApp", completed: false },
        { id: "3", text: "Confirmar tomador de decisão", completed: false },
      ]),
    },
  });

  await prisma.cardActivity.create({
    data: {
      cardId: card1.id,
      actionType: "CREATED",
      details: "Lead capturado via formulário web e atribuído a Carlos SDR.",
    },
  });

  // Card 2: Qualificação
  const card2 = await prisma.card.create({
    data: {
      pipeId: pipe.id,
      currentPhaseId: phaseQualify.id,
      title: "Logística Veloz - Automação de Pedidos e Roteirização",
      dealValue: 32000,
      priority: "URGENT",
      dueDate: new Date(Date.now() + 86400000),
      createdById: sdr.id,
    },
  });

  await prisma.cardFieldValue.createMany({
    data: [
      { cardId: card2.id, fieldId: fieldLeadName.id, value: "Fernanda Costa" },
      { cardId: card2.id, fieldId: fieldLeadEmail.id, value: "f.costa@logveloz.com" },
      { cardId: card2.id, fieldId: fieldLeadPhone.id, value: "(31) 97112-9988" },
      { cardId: card2.id, fieldId: fieldCompany.id, value: "Logística Veloz" },
      { cardId: card2.id, fieldId: fieldOrigin.id, value: "Indicação" },
      { cardId: card2.id, fieldId: fieldDealValue.id, value: "32000" },
      { cardId: card2.id, fieldId: fieldBantBudget.id, value: "R$ 5.000 a R$ 20.000/mês" },
    ],
  });

  await prisma.cardAssignee.create({ data: { cardId: card2.id, userId: sdr.id } });
  await prisma.cardLabel.create({ data: { cardId: card2.id, labelId: labelWarm.id } });

  // Card 3: Proposta Enviada
  const card3 = await prisma.card.create({
    data: {
      pipeId: pipe.id,
      currentPhaseId: phaseProposal.id,
      title: "Alpha BioTech - Pipeline de Vendas Hospitalares",
      dealValue: 95000,
      priority: "HIGH",
      dueDate: new Date(Date.now() + 86400000 * 3),
      createdById: closer.id,
    },
  });

  await prisma.cardFieldValue.createMany({
    data: [
      { cardId: card3.id, fieldId: fieldLeadName.id, value: "Dr. Marcelo Ramos" },
      { cardId: card3.id, fieldId: fieldLeadEmail.id, value: "marcelo@alphabiotech.med.br" },
      { cardId: card3.id, fieldId: fieldCompany.id, value: "Alpha BioTech" },
      { cardId: card3.id, fieldId: fieldPaymentTerms.id, value: "Anual à vista (15% desconto)" },
      { cardId: card3.id, fieldId: fieldDealValue.id, value: "95000" },
    ],
  });

  await prisma.cardAssignee.create({ data: { cardId: card3.id, userId: closer.id } });
  await prisma.cardLabel.create({ data: { cardId: card3.id, labelId: labelEnterprise.id } });

  // Card 4: Fechado Ganho
  const card4 = await prisma.card.create({
    data: {
      pipeId: pipe.id,
      currentPhaseId: phaseWon.id,
      title: "Varejo Prime - Gestão Integrada de Franquias",
      dealValue: 140000,
      priority: "MEDIUM",
      createdById: closer.id,
    },
  });

  await prisma.cardFieldValue.createMany({
    data: [
      { cardId: card4.id, fieldId: fieldLeadName.id, value: "Beatriz Nogueira" },
      { cardId: card4.id, fieldId: fieldLeadEmail.id, value: "beatriz@varejoprime.com.br" },
      { cardId: card4.id, fieldId: fieldCompany.id, value: "Varejo Prime" },
      { cardId: card4.id, fieldId: fieldDealValue.id, value: "140000" },
    ],
  });

  // 11. Criar Database Relacional: Clientes & Contas
  const table = await prisma.databaseTable.create({
    data: {
      organizationId: org.id,
      name: "Clientes & Contas Ativas",
      description: "Catálogo central de empresas clientes conectadas aos processos comerciais.",
    },
  });

  const dbFieldCnpj = await prisma.databaseField.create({
    data: { tableId: table.id, label: "CNPJ", identifier: "cnpj", type: "TEXT", order: 1 },
  });
  const dbFieldSegment = await prisma.databaseField.create({
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

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });