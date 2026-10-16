# Handoff Report — Explorer 2: Autenticação, RBAC, Metas e Restrição de Jornada

**Agente Responsável:** `teamwork_preview_explorer_survey_2`  
**Destinatário:** `parent` (Orchestrator ID: `ebb0a808-6dd6-4655-a7e9-916d6d653669`)  
**Data:** 16 de Outubro de 2026  
**Status:** Hard Handoff (Levantamento e arquitetura concluídos com êxito)  

---

## 1. Observation

Durante a investigação detalhada no repositório `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm`, observamos os seguintes pontos concretos:

1. **Vulnerabilidade no Cookie de Sessão:**
   - Em `src/app/api/auth/login/route.ts:16-19`:
     ```ts
     const res = Response.json({ success: true, user });
     res.headers.set(
       "Set-Cookie",
       `flowleads_session=${encodeURIComponent(JSON.stringify(user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
     );
     ```
     O cookie `flowleads_session` é gravado com o JSON puro codificado em URL, sem qualquer assinatura criptográfica (HMAC, JWT ou token opaco).
   - O cookie nunca é consumido ou validado no backend: em `src/app/api/auth/me/route.ts:5`:
     ```ts
     const user = await getDefaultUser();
     return Response.json({ user });
     ```
     A rota retorna sempre o primeiro usuário da base de dados, ignorando a identidade do cookie.

2. **Inexistência de Guardas de Rota e RBAC:**
   - Não existe `middleware.ts` no projeto (`find_by_name` retornou 0 arquivos fora de `node_modules`).
   - As rotas da API em `src/app/api/cards/route.ts:3-32`, `src/app/api/reports/route.ts:3-62` e `src/app/api/automations/route.ts` não executam checagem de autenticação nem de papéis.
   - A página `/pipes/[id]/automations` em `src/app/pipes/[id]/automations/page.tsx:8-60` pode ser acessada por qualquer perfil, permitindo que operadores comuns desativem ou criem automações (`handleToggle`, `handleCreate`).

3. **Ausência de Controle de Jornada (Horários/Dias):**
   - Execução de teste de login real às **18:11:34** (fora do expediente comercial de 08:00 às 18:00) com usuário vendedor:
     `Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body '{"email":"carlos@flowleads.com","password":"user123"}'`
   - Retornou sucesso imediato (`HTTP 200`, `{ success: true, user: Carlos SDR, role: MEMBER }`). Não há qualquer verificação de dias ou horários no código.

4. **Estado Atual da Tela Inicial e Metas:**
   - Em `src/app/page.tsx:22`:
     `<AppShell pipeId={defaultPipe?.id} userName="Gestor Comercial" orgName="Acme Corp Brasil">`
   - Em `src/app/page.tsx:29`:
     `<span>Pipefy Architecture & Complete CRM Engine</span>`
   - O arquivo renderiza apenas uma grade com os pipes disponíveis. Não há código, componente ou rota para "Gestão de Metas", termômetro de vendas ou ranking de equipe.
   - Busca por "ranking" e "meta" na pasta `src/` confirmou zero ocorrências relacionadas ao domínio de metas de vendas.

5. **Dados de Fechamento Existentes no Banco (`dev.db`):**
   - Consulta ao Prisma revelou que o vendedor `Carlos SDR` já possui:
     - 3 negócios na fase com `isFinalWon = true` totalizando `R$ 180.000,00`.
     - 12 leads atribuídos no total.
   - O modelo `User` em `prisma/schema.prisma:22-36` possui apenas `{ id, organizationId, name, email, passwordHash, role, avatarUrl, createdAt }`, sem campos para `whatsappNumber`, jornada de trabalho ou metas financeiras.

---

## 2. Logic Chain

A partir das observações fáticas acima, deduzimos os seguintes passos lógicos para o design da solução:

1. **Da Observação 1 (Cookie não assinado e ignorado):**
   - Como o cookie de sessão armazena JSON simples, qualquer usuário pode forjar o cabeçalho `Cookie` e assumir a identidade de outro colaborador ou do Gestor Comercial.
   - **Solução necessária:** Implementar assinatura com chave secreta via HMAC-SHA256 (`signSession` e `verifySession`) em `src/lib/auth.ts`. A rota `/api/auth/me` e as páginas de servidor (`getServerSession`) devem obrigatoriamente validar essa assinatura antes de fornecer acesso.

2. **Das Observações 2 e 3 (Ausência de RBAC e bloqueio de jornada):**
   - Como não há restrição de dias/horários, um operador pode trabalhar e manipular dados em fins de semana e fora do expediente comercial de 08:00 às 18:00.
   - **Solução necessária:** Inserir a checagem `checkScheduleAccess(user)` em `src/lib/auth.ts`, disparada imediatamente durante a validação no `POST /api/auth/login`. Caso o usuário não possua papel `ADMIN`/`SUPERVISOR` e o horário atual no fuso `America/Sao_Paulo` esteja fora de Seg-Sex 08:00-18:00, a API deve abortar com `HTTP 403 Forbidden` e mensagem amigável contendo as regras de jornada. Adicionalmente, proteger endpoints sensíveis com a função auxiliar `requireAuth(req, ["ADMIN", "SUPERVISOR"])`.

3. **Das Observações 4 e 5 (Metas inexistentes mas dados de cards disponíveis no banco):**
   - Para atender ao requisito R2 (abertura pós-login diretamente na "Gestão de Metas" com "Bem-vindo - [Nome]" e termômetro), a rota `/` (`src/app/page.tsx`) deve ser transformada no dashboard de metas.
   - Como os dados de cards ganhos (`isFinalWon = true`) e valores (`dealValue`) já estão estruturados no Prisma, a métrica de atingimento pode ser calculada nativamente:
     $$\% \text{ Atingido} = (\text{Valor Ganho} / \text{Meta}) \times 100$$
   - A extensão do modelo `User` para conter `monthlyTargetAmount`, `monthlyTargetDeals`, `whatsappNumber`, `allowedDays`, `workStartTime` e `workEndTime` provê suporte completo para persistência das configurações definidas pelo Supervisor.

---

## 3. Caveats

1. **Paralelismo dos Testes em SQLite:**
   - Durante a execução de `npm test`, constatou-se que os testes unitários do Node.js executam simultaneamente e concorrem sobre o mesmo arquivo SQLite (`prisma/dev.db`). Para evitar falhas transitórias de escrita concorrente em testes, as suítes que alteram o estado da automação devem ser executadas com base de dados devidamente limpa ou isolada.
2. **Fuso Horário do Servidor vs. Fuso de Negócio:**
   - O ambiente de execução do servidor pode estar configurado em UTC ou outro fuso local. Toda comparação de horas comerciais **deve explicitamente forçar** a timezone `America/Sao_Paulo` (Horário de Brasília) para evitar bloqueios indevidos em deploys serverless ou em nuvem.
3. **Escopo Delimitado:**
   - Este levantamento foca em Autenticação, RBAC, Metas e Jornada. O menu de 3 pontinhos do Kanban, uploads de arquivos e webhook nativo da Meta Ads estão sendo aprofundados simultaneamente pelo `teamwork_preview_explorer_survey_3`, e a reconstrução visual da Sidebar colapsável pelo `teamwork_preview_explorer_survey_1`.

---

## 4. Conclusion

1. O FlowLeads CRM possui um motor base de pipelines, cards e automações sólido, porém seu subsistema de autenticação e governança encontrava-se incompleto e vulnerável (cookie em plaintext, ausência de validação de horário e rotas de API desprotegidas).
2. A implementação do **Controle de Jornada com HTTP 403** é simples, cirúrgica e altamente eficaz através da função `checkScheduleAccess` validada no login e nos route handlers.
3. A transformação da página inicial `/` em **"Gestão de Metas"** é plenamente viável aproveitando a infraestrutura de dados já existente no banco de dados (somatório de `dealValue` em fases `isFinalWon`).
4. As especificações de esquema, código e arquitetura foram integralmente documentadas em `C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm\.agents\teamwork_preview_explorer_survey_2\report.md`.

---

## 5. Verification Method

Para verificar de forma independente as conclusões deste relatório:

1. **Verificar a vulnerabilidade do cookie atual:**
   - Inspecionar `src/app/api/auth/login/route.ts:18` e confirmar a string sem assinatura.
2. **Reproduzir o login fora de horário:**
   - Executar o seguinte comando no terminal fora do horário das 08:00 às 18:00 (ou em fim de semana):
     ```powershell
     Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"carlos@flowleads.com","password":"user123"}'
     ```
   - Observar que o sistema atual retorna sucesso (código 200), comprovando a ausência do bloqueio.
3. **Verificar o total de vendas do vendedor:**
   - Executar script de inspeção do Prisma:
     ```powershell
     node --experimental-strip-types -e "import('./src/lib/prisma.ts').then(async m => { const u = await m.prisma.user.findFirst({ where: { email: 'carlos@flowleads.com' }, include: { assignees: { include: { card: { include: { currentPhase: true } } } } } }); const won = u.assignees.filter(a => a.card.currentPhase.isFinalWon); console.log('Carlos Won:', won.reduce((s, a) => s + (a.card.dealValue || 0), 0)); process.exit(0); })"
     ```
   - Confirmar o valor de `R$ 180.000,00` pronto para alimentar o termômetro de metas.
4. **Condição de Invalidação:**
   - Este relatório será invalidado caso a aplicação adote outro provedor de autenticação externo (ex: NextAuth/Clerk) que sobreponha o cookie nativo, ou caso a regra de jornada não seja restritiva a nível de API.
