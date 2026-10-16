import test from "node:test";
import assert from "node:assert/strict";
import { GET as getPipes } from "../src/app/api/pipes/route.ts";
import { GET as getPublicForm, POST as submitPublicForm } from "../src/app/api/public-form/[slug]/route.ts";
import { GET as getCards } from "../src/app/api/cards/route.ts";
import { GET as getReports } from "../src/app/api/reports/route.ts";
import { GET as getDatabase } from "../src/app/api/database/route.ts";

test("Task 5: REST API Route Handlers Integration Test", async () => {
  // 1. GET /api/pipes
  const pipesRes = await getPipes();
  const pipes = await pipesRes.json();
  assert.ok(pipes.length > 0);
  const pipeId = pipes[0].id;

  // 2. GET /api/public-form/crm-vendas
  const formRes = await getPublicForm(new Request("http://localhost/api/public-form/crm-vendas"), {
    params: Promise.resolve({ slug: "crm-vendas" }),
  });
  assert.equal(formRes.status, 200);
  const formData = await formRes.json();
  assert.equal(formData.pipeName, "Funil de Vendas & Gestão de Leads");
  assert.ok(formData.fields.length >= 4);

  // 3. POST /api/public-form/crm-vendas (Submissão pública de novo lead)
  const submitReq = new Request("http://localhost/api/public-form/crm-vendas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead_name: "Juliana Mendes",
      lead_email: "juliana@inovarede.com.br",
      lead_phone: "(21) 99887-7665",
      company_name: "Inova Rede Telecom",
      deal_value: "35000",
      lead_need: "Necessidade de CRM de alta performance.",
    }),
  });

  const submitRes = await submitPublicForm(submitReq, {
    params: Promise.resolve({ slug: "crm-vendas" }),
  });
  assert.equal(submitRes.status, 201);
  const submitJson = await submitRes.json();
  assert.equal(submitJson.success, true);
  assert.ok(submitJson.cardId);

  // 4. GET /api/cards?pipeId=...
  const cardsReq = new Request(`http://localhost/api/cards?pipeId=${pipeId}`);
  const cardsRes = await getCards(cardsReq);
  const cards = await cardsRes.json();
  assert.ok(cards.some((c: any) => c.title.includes("Inova Rede Telecom")));

  // 5. GET /api/reports?pipeId=...
  const reportsReq = new Request(`http://localhost/api/reports?pipeId=${pipeId}`);
  const reportsRes = await getReports(reportsReq);
  const reportsData = await reportsRes.json();
  assert.ok(reportsData.summary);
  assert.ok(reportsData.funnel.length === 7);
  assert.ok(reportsData.summary.totalCards >= 4);

  // 6. GET /api/database
  const dbRes = await getDatabase();
  const dbTables = await dbRes.json();
  assert.ok(dbTables.length > 0);
  assert.equal(dbTables[0].name, "Clientes & Contas Ativas");
});