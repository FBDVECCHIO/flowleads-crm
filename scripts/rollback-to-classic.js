import { execSync } from "child_process";

console.log("======================================================");
console.log("  A.T.L.A.S. — PROTOCOLO DE RESTAURAÇÃO FLOWLEADS CRM");
console.log("  Revertendo para o design Clássico Estável (Tag: backup-pre-liquid-glass)");
console.log("======================================================\n");

try {
  console.log("1. Restaurando arquivos do checkpoint pré-Liquid Glass...");
  execSync("git checkout backup-pre-liquid-glass -- src/ styles/ scripts/ prisma/ package.json", { stdio: "inherit" });

  console.log("\n2. Recompilando o projeto...");
  execSync("npm run build", { stdio: "inherit" });

  console.log("\n3. Criando commit de reversão...");
  execSync("git commit -am \"chore: rollback to classic stable design\"", { stdio: "inherit" });

  console.log("\n4. Atualizando repositório remoto (GitHub)...");
  execSync("git push origin main", { stdio: "inherit" });

  console.log("\n5. Promovendo deploy de produção na Vercel...");
  execSync("npx vercel --prod --yes", { stdio: "inherit" });

  console.log("\n======================================================");
  console.log("  RESTAURAÇÃO CONCLUÍDA COM SUCESSO!");
  console.log("  O FlowLeads retornou 100% ao visual clássico anterior.");
  console.log("  URL: https://flowleads-crm-blush.vercel.app");
  console.log("======================================================");
} catch (error) {
  console.error("\nErro durante o processo de restauração:", error.message);
  process.exit(1);
}
