# Handoff Report — Explorer 3: Kanban, Meta Ads & Security Survey

## 1. Observation
- **Quadro Kanban e Operações de Card:**
  - src/components/kanban/CardItem.tsx (linhas 1-138): O componente renderiza apenas informações básicas do lead, badges de SLA, tags existentes em modo somente-leitura e o botão hover de avançar fase imediata (linhas 123-134). Não há botão de 3 pontinhos (MoreVertical), seletor de cor do card, menu de movimentação direta nem exclusão de card.
  - src/app/api/cards/[id]/route.ts (linhas 1-23): Implementa apenas os métodos GET e PUT. O método DELETE **não existe** no endpoint.
  - src/services/cardService.ts (linhas 1-251): Não possui o método deleteCard.
- **Governança de Tags e Anexos:**
  - prisma/schema.prisma (linhas 99-106, 157-166): O modelo Label e CardLabel existem no banco, mas não há rota de API para criação de etiquetas nem interface para manipulá-las no card.
  - No schema.prisma, não existe o modelo CardAttachment nem qualquer campo para upload/gerenciamento de documentos ou receitas médicas.
- **Webhook da Meta Ads:**
  - src/app/api/webhooks/meta **não existe** na base de código.
  - Apenas o arquivo src/services/webhookDispatcher.ts existe, mas atua exclusivamente para disparo de webhooks externos de saída (*outbound*), sem suporte a recepção (*inbound*), sem validação de hub.challenge e sem verificação de assinatura x-hub-signature-256.
- **Cibersegurança e Vulnerabilidade de Sessão:**
  - src/app/api/auth/login/route.ts (linhas 16-19):
    `	ypescript
    res.headers.set(
      "Set-Cookie",
      lowleads_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
    );
    `
    O cookie de sessão armazena o objeto do usuário diretamente em formato JSON codificado em URI, sem assinatura digital (HMAC/JWT), permitindo alteração arbitrária de perfil e escalonamento de privilégios para ADMIN.
  - src/app/api/auth/me/route.ts (linhas 1-10): Ignora os cookies de requisição e retorna estaticamente getDefaultUser(), sempre logando o primeiro usuário do banco.
  - prisma/seed.ts (linhas 39-40): Usa crypt.hash(password, 10) com 10 salt rounds em vez do padrão recomendado de 12 rounds.
  - src/app/api/cards/route.ts e src/app/api/cards/[id]/move/route.ts: Inexistem verificações de autenticação ou guards de RBAC.
- **Banco de Dados e Testes:**
  - prisma/schema.prisma (linhas 1-4): O banco está configurado como provider = "sqlite" com arquivo local ile:./dev.db.
  - Ao executar 
pm test (
ode --experimental-strip-types --test tests/*.test.ts), ocorrem falhas de colisão de concorrência devido à execução paralela de testes sobre o mesmo arquivo SQLite (	ests/automation.test.ts e 	ests/full-flow.test.ts). Ao executar com --test-concurrency=1, todos os 7 testes passam com 100% de sucesso.

## 2. Logic Chain
1. A partir da inspeção de CardItem.tsx e CardDrawer.tsx (Observação 1), constata-se a ausência de elementos de gatilho para menu de contexto, inviabilizando no estado atual o atendimento ao requisito R3 (cor, movimentação direta, tags e anexos).
2. A análise dos route handlers src/app/api/cards/[id]/route.ts e cardService.ts demonstra que a exclusão de leads não pode ser realizada nem pelo front nem por chamadas de API, exigindo a criação do método deleteCard e da rota DELETE.
3. A ausência de modelo de anexos no schema.prisma e a inexistência de rotas de upload demonstram que o envio de receitas e propostas requer tanto uma migração no banco de dados quanto a criação de um serviço de upload sanitizado.
4. O exame minucioso da criação de cookies em login/route.ts (Observação 4) comprova uma vulnerabilidade crítica de integridade: a ausência de assinatura HMAC permite falsificação direta do cookie por qualquer cliente, configurando risco de acesso indevido como administrador.
5. A inexistência de arquivos na pasta src/app/api/webhooks/meta confirma que a ingestão de leads da Meta precisa ser construída integralmente (validação do handshake, verificação HMAC da assinatura x-hub-signature-256, consulta à Graph API e roteamento para o WhatsApp do vendedor).
6. O teste de concorrência no SQLite (Observação 5) comprova que o banco de dados local não suporta operações concorrentes em escala nem persistência em ambiente serverless efêmero (Vercel), justificando a necessidade de suporte a Turso/PostgreSQL e parametrização do runner de testes.

## 3. Caveats
- Não foram alterados arquivos de código-fonte de produção durante esta investigação, em estrito cumprimento da diretriz de somente-leitura (Read-Only Explorer).
- A integração com a Graph API da Meta dependerá de credenciais reais (META_PAGE_ACCESS_TOKEN, META_APP_SECRET, META_VERIFY_TOKEN) configuradas nas variáveis de ambiente em produção; para testes locais e de CI, mocks robustos deverão ser fornecidos na suíte de testes.
- As telas de "Gestão de Metas" e "Controle de Acesso por Horário" (R2) estão sendo levantadas em conjunto pelo Explorer 2 e convergem na expansão do modelo User e SalesGoal.

## 4. Conclusion
O **FlowLeads CRM** dispõe de uma base estruturada com Next.js 15 e Prisma ORM para a operação básica do funil (paridade Pipefy). No entanto, para atingir conformidade total com a especificação original do projeto, são indispensáveis:
1. Implementar o menu de contexto (3 pontinhos) em CardItem.tsx com as 4 opções obrigatórias (cor, movimentação direta, etiquetas com bloqueio para não-supervisores e upload de anexos).
2. Implementar a rota DELETE /api/cards/[id] com modal de confirmação de exclusão.
3. Criar a rota receptiva /api/webhooks/meta com validação de handshake e assinatura HMAC-SHA256, sincronizando dados da Graph API e roteando leads para o WhatsApp do vendedor.
4. Corrigir a vulnerabilidade crítica de sessão, assinando o cookie com HMAC/JWT e vinculando a impressão digital do dispositivo (anti-session hijacking), além de proteger todos os route handlers de API com guards de RBAC.
5. Adicionar suporte a banco serverless (Turso/PostgreSQL) e armazenamento em nuvem para anexos.

## 5. Verification Method
- **Verificação dos Arquivos Auditados:**
  - Inspecionar src/app/api/auth/login/route.ts linha 18 para atestar o cookie plaintext.
  - Inspecionar src/components/kanban/CardItem.tsx para verificar a ausência do menu de 3 pontinhos.
  - Inspecionar src/app/api/cards/[id]/route.ts para verificar a ausência do método DELETE.
  - Inspecionar prisma/schema.prisma para verificar a ausência de color em Card e a falta de CardAttachment.
- **Verificação da Suíte de Testes:**
  - Executar comando sequencial para atestar o comportamento do SQLite:
    
ode --experimental-strip-types --test --test-concurrency=1 tests/*.test.ts
    (Resultado observado: 7 testes aprovados, duração de aproximadamente 5.3s).
- **Condições de Invalidação:**
  - Este diagnóstico será invalidado se qualquer arquivo das rotas /api/webhooks/meta já estiver presente ou se a biblioteca de autenticação já estiver empregando tokens assinados com verificação de fingerprint.
