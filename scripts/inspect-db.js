import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function check() {
  const orgs = await prisma.organization.findMany();
  console.log("Organizations:", orgs);
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, organizationId: true } });
  console.log("Users:", users);
  const stores = await prisma.store.findMany({ select: { id: true, name: true, organizationId: true } });
  console.log("Stores:", stores);
  const pipes = await prisma.pipe.findMany({ select: { id: true, name: true, organizationId: true } });
  console.log("Pipes:", pipes);
}
check().finally(() => prisma.$disconnect());
