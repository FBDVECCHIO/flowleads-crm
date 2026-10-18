import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Iniciando ativação do Row Level Security (RLS) no schema flowleads do Supabase...");

  const tables = await prisma.$queryRawUnsafe(
    "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'flowleads' ORDER BY tablename;"
  );

  console.log(`Encontradas ${tables.length} tabelas no schema 'flowleads'.`);

  for (const t of tables) {
    const tableName = t.tablename;
    console.log(`Aplicando ENABLE ROW LEVEL SECURITY na tabela: flowleads."${tableName}"...`);
    await prisma.$executeRawUnsafe(
      `ALTER TABLE flowleads."${tableName}" ENABLE ROW LEVEL SECURITY;`
    );
  }

  console.log("\n🔍 Verificando status do RLS após execução:");
  const verifiedTables = await prisma.$queryRawUnsafe(
    "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'flowleads' ORDER BY tablename;"
  );

  let allEnabled = true;
  for (const t of verifiedTables) {
    console.log(`- ${t.tablename.padEnd(25)}: RLS ATIVO = ${t.rowsecurity ? "✅ SIM" : "❌ NÃO"}`);
    if (!t.rowsecurity) allEnabled = false;
  }

  if (allEnabled) {
    console.log("\n🎉 SUCESSO: Todas as tabelas do schema flowleads estão com Row Level Security ATIVADO!");
  } else {
    console.error("\n⚠️ ATENÇÃO: Algumas tabelas não puderam ser protegidas por RLS.");
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("Erro fatal ao habilitar RLS:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
