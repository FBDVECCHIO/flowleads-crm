import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `flowleads-backup-${timestamp}.json`);
  console.log(`📦 Iniciando backup estruturado do banco de dados FlowLeads...`);

  const [
    organizations,
    users,
    pipes,
    phases,
    fields,
    cards,
    cardFieldValues,
    labels,
    cardLabels,
    cardAssignees,
    cardComments,
    cardActivities,
    cardChecklists,
    checklistItems,
    stores,
    campaigns,
    automations,
    systemMessages,
  ] = await Promise.all([
    prisma.organization.findMany(),
    prisma.user.findMany(),
    prisma.pipe.findMany(),
    prisma.phase.findMany(),
    prisma.field.findMany(),
    prisma.card.findMany(),
    prisma.cardFieldValue.findMany(),
    prisma.label.findMany(),
    prisma.cardLabel.findMany(),
    prisma.cardAssignee.findMany(),
    prisma.cardComment.findMany(),
    prisma.cardActivity.findMany(),
    prisma.cardChecklist.findMany(),
    prisma.checklistItem.findMany(),
    prisma.store.findMany(),
    prisma.campaign.findMany(),
    prisma.automation.findMany(),
    prisma.systemMessage.findMany(),
  ]);

  const backupData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "production",
      summary: {
        organizations: organizations.length,
        users: users.length,
        pipes: pipes.length,
        phases: phases.length,
        fields: fields.length,
        cards: cards.length,
        cardFieldValues: cardFieldValues.length,
        labels: labels.length,
        cardLabels: cardLabels.length,
        cardAssignees: cardAssignees.length,
        cardComments: cardComments.length,
        cardActivities: cardActivities.length,
        cardChecklists: cardChecklists.length,
        checklistItems: checklistItems.length,
        stores: stores.length,
        campaigns: campaigns.length,
        automations: automations.length,
        systemMessages: systemMessages.length,
      },
    },
    data: {
      organizations,
      users,
      pipes,
      phases,
      fields,
      cards,
      cardFieldValues,
      labels,
      cardLabels,
      cardAssignees,
      cardComments,
      cardActivities,
      cardChecklists,
      checklistItems,
      stores,
      campaigns,
      automations,
      systemMessages,
    },
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), "utf8");

  console.log(`\n✅ Backup concluído com sucesso!`);
  console.log(`📁 Arquivo salvo em: ${backupFile}`);
  console.log(`📊 Sumário de registros salvos:`);
  console.table(backupData.metadata.summary);

  return backupFile;
}

runBackup()
  .catch((err) => {
    console.error("❌ Falha crítica ao gerar backup:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
