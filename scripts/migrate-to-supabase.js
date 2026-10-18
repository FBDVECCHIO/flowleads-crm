import { createClient } from "@libsql/client";
import { PrismaClient } from "@prisma/client";

const sqlite = createClient({
  url: "file:prisma/dev.db"
});

const prisma = new PrismaClient();

function parseDate(v) {
  if (!v) return null;
  if (typeof v === "number") return new Date(v);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function parseBool(v, def = false) {
  if (v === null || v === undefined) return def;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
  return def;
}

async function migrate() {
  console.log("Starting migration from SQLite to Supabase PostgreSQL (flowleads schema)...");

  // 1. Organization
  console.log("Migrating Organizations...");
  const orgs = (await sqlite.execute("SELECT * FROM Organization")).rows;
  for (const org of orgs) {
    await prisma.organization.upsert({
      where: { id: String(org.id) },
      update: {},
      create: {
        id: String(org.id),
        name: String(org.name),
        slug: String(org.slug),
        createdAt: parseDate(org.createdAt) || new Date(),
        updatedAt: parseDate(org.updatedAt) || new Date(),
      }
    });
  }
  console.log(`Organizations migrated: ${orgs.length}`);

  // 2. User
  console.log("Migrating Users...");
  const users = (await sqlite.execute("SELECT * FROM User")).rows;
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: String(u.id) },
      update: {},
      create: {
        id: String(u.id),
        organizationId: String(u.organizationId),
        name: String(u.name),
        email: String(u.email),
        passwordHash: String(u.passwordHash),
        role: String(u.role || "MEMBER"),
        avatarUrl: u.avatarUrl ? String(u.avatarUrl) : null,
        createdAt: parseDate(u.createdAt) || new Date(),
        whatsappNumber: u.whatsappNumber ? String(u.whatsappNumber) : null,
        monthlyTargetAmount: u.monthlyTargetAmount !== null ? Number(u.monthlyTargetAmount) : 100000,
        monthlyTargetDeals: u.monthlyTargetDeals !== null ? Number(u.monthlyTargetDeals) : 10,
        workingDaysPerMonth: u.workingDaysPerMonth !== null ? Number(u.workingDaysPerMonth) : 22,
        allowedMenus: u.allowedMenus ? String(u.allowedMenus) : "metas,kanban,reports",
        allowedDays: u.allowedDays ? String(u.allowedDays) : "1,2,3,4,5",
        workStartTime: u.workStartTime ? String(u.workStartTime) : "08:00",
        workEndTime: u.workEndTime ? String(u.workEndTime) : "18:00",
      }
    });
  }
  console.log(`Users migrated: ${users.length}`);

  // 3. Pipe
  console.log("Migrating Pipes...");
  const pipes = (await sqlite.execute("SELECT * FROM Pipe")).rows;
  for (const p of pipes) {
    await prisma.pipe.upsert({
      where: { id: String(p.id) },
      update: {},
      create: {
        id: String(p.id),
        organizationId: String(p.organizationId),
        name: String(p.name),
        description: p.description ? String(p.description) : null,
        icon: String(p.icon || "Briefcase"),
        color: String(p.color || "#0b66c3"),
        isPublicFormEnabled: parseBool(p.isPublicFormEnabled, true),
        publicFormSlug: String(p.publicFormSlug),
        slaEnabled: parseBool(p.slaEnabled, true),
        createdAt: parseDate(p.createdAt) || new Date(),
        updatedAt: parseDate(p.updatedAt) || new Date(),
      }
    });
  }
  console.log(`Pipes migrated: ${pipes.length}`);

  // 4. Phase
  console.log("Migrating Phases...");
  const phases = (await sqlite.execute("SELECT * FROM Phase")).rows;
  for (const ph of phases) {
    await prisma.phase.upsert({
      where: { id: String(ph.id) },
      update: {},
      create: {
        id: String(ph.id),
        pipeId: String(ph.pipeId),
        name: String(ph.name),
        description: ph.description ? String(ph.description) : null,
        order: Number(ph.order || 0),
        color: String(ph.color || "#3b82f6"),
        isFinalWon: parseBool(ph.isFinalWon, false),
        isFinalLost: parseBool(ph.isFinalLost, false),
        slaHours: ph.slaHours !== null ? Number(ph.slaHours) : null,
        wipLimit: ph.wipLimit !== null ? Number(ph.wipLimit) : null,
        createdAt: parseDate(ph.createdAt) || new Date(),
      }
    });
  }
  console.log(`Phases migrated: ${phases.length}`);

  // 5. Field
  console.log("Migrating Fields...");
  const fields = (await sqlite.execute("SELECT * FROM Field")).rows;
  for (const f of fields) {
    await prisma.field.upsert({
      where: { id: String(f.id) },
      update: {},
      create: {
        id: String(f.id),
        pipeId: String(f.pipeId),
        phaseId: f.phaseId ? String(f.phaseId) : null,
        label: String(f.label),
        identifier: String(f.identifier),
        type: String(f.type || "TEXT"),
        isRequired: parseBool(f.isRequired, false),
        options: f.options ? String(f.options) : null,
        placeholder: f.placeholder ? String(f.placeholder) : null,
        helpText: f.helpText ? String(f.helpText) : null,
        order: Number(f.order || 0),
      }
    });
  }
  console.log(`Fields migrated: ${fields.length}`);

  // 6. Label
  console.log("Migrating Labels...");
  const labels = (await sqlite.execute("SELECT * FROM Label")).rows;
  for (const l of labels) {
    await prisma.label.upsert({
      where: { id: String(l.id) },
      update: {},
      create: {
        id: String(l.id),
        pipeId: String(l.pipeId),
        name: String(l.name),
        color: String(l.color || "#ef4444"),
      }
    });
  }
  console.log(`Labels migrated: ${labels.length}`);

  // 7. Card
  console.log("Migrating Cards...");
  const cards = (await sqlite.execute("SELECT * FROM Card")).rows;
  for (const c of cards) {
    await prisma.card.upsert({
      where: { id: String(c.id) },
      update: {},
      create: {
        id: String(c.id),
        pipeId: String(c.pipeId),
        currentPhaseId: String(c.currentPhaseId),
        title: String(c.title),
        dealValue: c.dealValue !== null ? Number(c.dealValue) : 0,
        priority: String(c.priority || "MEDIUM"),
        color: c.color ? String(c.color) : "#ffffff",
        dueDate: parseDate(c.dueDate),
        slaStatus: String(c.slaStatus || "ON_TRACK"),
        phaseEnteredAt: parseDate(c.phaseEnteredAt) || new Date(),
        createdById: c.createdById ? String(c.createdById) : null,
        createdAt: parseDate(c.createdAt) || new Date(),
        updatedAt: parseDate(c.updatedAt) || new Date(),
      }
    });
  }
  console.log(`Cards migrated: ${cards.length}`);

  // 8. CardFieldValue
  console.log("Migrating CardFieldValues...");
  const cardFieldValues = (await sqlite.execute("SELECT * FROM CardFieldValue")).rows;
  for (const cfv of cardFieldValues) {
    await prisma.cardFieldValue.upsert({
      where: { id: String(cfv.id) },
      update: {},
      create: {
        id: String(cfv.id),
        cardId: String(cfv.cardId),
        fieldId: String(cfv.fieldId),
        value: String(cfv.value || ""),
      }
    });
  }
  console.log(`CardFieldValues migrated: ${cardFieldValues.length}`);

  // 9. CardAssignee
  console.log("Migrating CardAssignees...");
  const cardAssignees = (await sqlite.execute("SELECT * FROM CardAssignee")).rows;
  for (const ca of cardAssignees) {
    await prisma.cardAssignee.upsert({
      where: { id: String(ca.id) },
      update: {},
      create: {
        id: String(ca.id),
        cardId: String(ca.cardId),
        userId: String(ca.userId),
      }
    });
  }
  console.log(`CardAssignees migrated: ${cardAssignees.length}`);

  // 10. CardLabel
  console.log("Migrating CardLabels...");
  const cardLabels = (await sqlite.execute("SELECT * FROM CardLabel")).rows;
  for (const cl of cardLabels) {
    await prisma.cardLabel.upsert({
      where: { id: String(cl.id) },
      update: {},
      create: {
        id: String(cl.id),
        cardId: String(cl.cardId),
        labelId: String(cl.labelId),
      }
    });
  }
  console.log(`CardLabels migrated: ${cardLabels.length}`);

  // 11. CardChecklist
  console.log("Migrating CardChecklists...");
  const cardChecklists = (await sqlite.execute("SELECT * FROM CardChecklist")).rows;
  for (const cc of cardChecklists) {
    await prisma.cardChecklist.upsert({
      where: { id: String(cc.id) },
      update: {},
      create: {
        id: String(cc.id),
        cardId: String(cc.cardId),
        title: String(cc.title || "Tarefas"),
        items: String(cc.items || "[]"),
      }
    });
  }
  console.log(`CardChecklists migrated: ${cardChecklists.length}`);

  // 12. CardComment
  console.log("Migrating CardComments...");
  const cardComments = (await sqlite.execute("SELECT * FROM CardComment")).rows;
  for (const cm of cardComments) {
    await prisma.cardComment.upsert({
      where: { id: String(cm.id) },
      update: {},
      create: {
        id: String(cm.id),
        cardId: String(cm.cardId),
        userId: cm.userId ? String(cm.userId) : null,
        authorName: String(cm.authorName || "Usuário"),
        content: String(cm.content || ""),
        createdAt: parseDate(cm.createdAt) || new Date(),
      }
    });
  }
  console.log(`CardComments migrated: ${cardComments.length}`);

  // 13. CardActivity
  console.log("Migrating CardActivities...");
  const cardActivities = (await sqlite.execute("SELECT * FROM CardActivity")).rows;
  for (const ca of cardActivities) {
    await prisma.cardActivity.upsert({
      where: { id: String(ca.id) },
      update: {},
      create: {
        id: String(ca.id),
        cardId: String(ca.cardId),
        userId: ca.userId ? String(ca.userId) : null,
        actionType: String(ca.actionType || "CREATED"),
        details: String(ca.details || ""),
        createdAt: parseDate(ca.createdAt) || new Date(),
      }
    });
  }
  console.log(`CardActivities migrated: ${cardActivities.length}`);

  // 14. CardAttachment
  console.log("Migrating CardAttachments...");
  const cardAttachments = (await sqlite.execute("SELECT * FROM CardAttachment")).rows;
  for (const cat of cardAttachments) {
    await prisma.cardAttachment.upsert({
      where: { id: String(cat.id) },
      update: {},
      create: {
        id: String(cat.id),
        cardId: String(cat.cardId),
        fileName: String(cat.fileName),
        fileUrl: String(cat.fileUrl),
        mimeType: String(cat.mimeType),
        sizeBytes: Number(cat.sizeBytes || 0),
        createdAt: parseDate(cat.createdAt) || new Date(),
      }
    });
  }
  console.log(`CardAttachments migrated: ${cardAttachments.length}`);

  // 15. Store
  console.log("Migrating Stores...");
  const stores = (await sqlite.execute("SELECT * FROM Store")).rows;
  for (const s of stores) {
    await prisma.store.upsert({
      where: { id: String(s.id) },
      update: {},
      create: {
        id: String(s.id),
        organizationId: String(s.organizationId),
        name: String(s.name),
        description: s.description ? String(s.description) : null,
        phone: s.phone ? String(s.phone) : null,
        isActive: parseBool(s.isActive, true),
        createdAt: parseDate(s.createdAt) || new Date(),
        updatedAt: parseDate(s.updatedAt) || new Date(),
      }
    });
  }
  console.log(`Stores migrated: ${stores.length}`);

  // 16. Seller
  console.log("Migrating Sellers...");
  const sellers = (await sqlite.execute("SELECT * FROM Seller")).rows;
  for (const sl of sellers) {
    await prisma.seller.upsert({
      where: { id: String(sl.id) },
      update: {},
      create: {
        id: String(sl.id),
        organizationId: String(sl.organizationId),
        storeId: sl.storeId ? String(sl.storeId) : null,
        name: String(sl.name),
        phone: sl.phone ? String(sl.phone) : null,
        role: String(sl.role || "VENDEDOR"),
        isActive: parseBool(sl.isActive, true),
        createdAt: parseDate(sl.createdAt) || new Date(),
        updatedAt: parseDate(sl.updatedAt) || new Date(),
      }
    });
  }
  console.log(`Sellers migrated: ${sellers.length}`);

  // 17. Campaign
  console.log("Migrating Campaigns...");
  const campaigns = (await sqlite.execute("SELECT * FROM Campaign")).rows;
  for (const cmp of campaigns) {
    await prisma.campaign.upsert({
      where: { id: String(cmp.id) },
      update: {},
      create: {
        id: String(cmp.id),
        organizationId: String(cmp.organizationId),
        name: String(cmp.name),
        description: cmp.description ? String(cmp.description) : null,
        imageUrl: cmp.imageUrl ? String(cmp.imageUrl) : null,
        startDate: parseDate(cmp.startDate),
        endDate: parseDate(cmp.endDate),
        products: cmp.products ? String(cmp.products) : null,
        eligibleStores: cmp.eligibleStores ? String(cmp.eligibleStores) : null,
        isActive: parseBool(cmp.isActive, true),
        createdAt: parseDate(cmp.createdAt) || new Date(),
        updatedAt: parseDate(cmp.updatedAt) || new Date(),
      }
    });
  }
  console.log(`Campaigns migrated: ${campaigns.length}`);

  // 18. SystemMessage
  console.log("Migrating SystemMessages...");
  const sysMsgs = (await sqlite.execute("SELECT * FROM SystemMessage")).rows;
  for (const sm of sysMsgs) {
    await prisma.systemMessage.upsert({
      where: { id: String(sm.id) },
      update: {},
      create: {
        id: String(sm.id),
        organizationId: String(sm.organizationId),
        title: String(sm.title),
        content: String(sm.content),
        authorName: String(sm.authorName || "Supervisor"),
        priority: String(sm.priority || "NORMAL"),
        createdAt: parseDate(sm.createdAt) || new Date(),
        updatedAt: parseDate(sm.updatedAt) || new Date(),
      }
    });
  }
  console.log(`SystemMessages migrated: ${sysMsgs.length}`);

  // 19. ChecklistItem
  console.log("Migrating ChecklistItems...");
  const checklistItems = (await sqlite.execute("SELECT * FROM ChecklistItem")).rows;
  for (const ci of checklistItems) {
    await prisma.checklistItem.upsert({
      where: { id: String(ci.id) },
      update: {},
      create: {
        id: String(ci.id),
        organizationId: String(ci.organizationId),
        title: String(ci.title),
        description: ci.description ? String(ci.description) : null,
        order: Number(ci.order || 0),
        isActive: parseBool(ci.isActive, true),
        createdAt: parseDate(ci.createdAt) || new Date(),
        updatedAt: parseDate(ci.updatedAt) || new Date(),
      }
    });
  }
  console.log(`ChecklistItems migrated: ${checklistItems.length}`);

  console.log("\n=================================");
  console.log("MIGRATION COMPLETED SUCCESSFULLY!");
  console.log("Supabase Verifications:");
  console.log("- Organizations:", await prisma.organization.count());
  console.log("- Users:", await prisma.user.count());
  console.log("- Pipes:", await prisma.pipe.count());
  console.log("- Phases:", await prisma.phase.count());
  console.log("- Cards:", await prisma.card.count());
  console.log("- Stores:", await prisma.store.count());
  console.log("- Sellers:", await prisma.seller.count());
  console.log("- Campaigns:", await prisma.campaign.count());
  console.log("- ChecklistItems:", await prisma.checklistItem.count());
  console.log("=================================\n");

  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
