# FlowLeads CRM - Especificacao Arquitetural e Design do Sistema (Pipefy Parity)

## 1. Visao Geral e Proposito
O **FlowLeads CRM** e uma plataforma de gestao de leads e processos comerciais inspirada na arquitetura, flexibilidade e poder do Pipefy (https://www.pipefy.com/pt-br/). O sistema combina:
- Visualizacao dinamica em **Quadro Kanban**, **Lista** e **Tabela**.
- Motor de **Formularios Dinamicos e Publicos** (captura automatica de leads via landing page ou link publico sem autenticacao).
- Motor de **Campos Customizados e Fases** (obrigatoriedade por fase, SLA de atendimento, fases finais Won/Lost).
- Motor de **Automacoes No-Code** (Gatilho -> Condicao -> Acao: mover card, atualizar campo, atribuir lead via rodizio, disparar webhooks e simular e-mails).
- **Database Central de Clientes e Empresas** independente, com conexao direta aos cards.
- **Painel de Metricas e Relatorios** (Funil de vendas, taxa de conversao, volume de leads, exportacao CSV).
- **API REST e Webhooks** para integracoes externas (Zapier, Make, n8n).

## 2. Pilha Tecnologica
- **Framework Principal:** Next.js 15 (App Router, Server Actions e Route Handlers REST).
- **Linguagem:** TypeScript (Strict mode).
- **Banco de Dados & ORM:** SQLite com Prisma ORM (zero configuracao, arquivo local `dev.db`, transacoes atomicas ACID).
- **Estilizacao e UI:** Tailwind CSS + Lucide Icons + Radix UI Primitives + Componentes inspirados na identidade visual moderna do Pipefy.
- **Interatividade & Drag and Drop:** `@hello-pangea/dnd` ou HTML5 Drag-and-Drop nativo robusto e testavel.
- **Autenticacao:** Sessao baseada em Cookie seguro / JWT com senhas criptografadas via `bcryptjs`, suporte a Multi-Tenancy (Organizacoes / Workspaces) e papeis (Admin, Member, Viewer).
- **Validacao e Testes:** Vitest + Playwright / Agent-Browser CLI para testes de ponta a ponta e navegacao real.

## 3. Arquitetura em Camadas
1. **Presentation Layer (Web UI):**
   - `/auth/login`, `/auth/register`: Autenticacao e onboarding de workspace.
   - `/pipes/[pipeId]`: Visualizacao Kanban, Lista e Tabela do Funil de Leads.
   - `/pipes/[pipeId]/settings`: Configuracao de fases, campos, SLAs e regras.
   - `/pipes/[pipeId]/automations`: Editor de regras no-code (Gatilho -> Acao).
   - `/pipes/[pipeId]/reports`: Dashboard analitico e relatorios com funil de conversao.
   - `/database`: Gestao de tabelas relacionais (Contatos, Empresas).
   - `/public/forms/[slug]`: Formulario publico de captura de leads acessivel externamente.
2. **Business & Automation Layer:**
   - `AutomationEngine`: Processador de eventos assincrono/sincrono que escuta mudancas de estado dos cards e executa acoes encadeadas.
   - `SlaEngine`: Calculador de SLAs e tempos de permanencia por fase.
   - `WebhookDispatcher`: Disparo de eventos HTTP POST para integracoes externas.
   - `EmailOutbox`: Registro e disparo de e-mails de notificacao e templates dinamicos.
3. **Data Layer (Prisma & SQLite):**
   - Repositorios e servicos tipados para isolamento e integridade referencial.

## 4. Fluxo de Dados e Interacoes Principais
1. **Captura:** Lead preenche o formulario publico (`/public/forms/crm-vendas`). O sistema valida os campos obrigatorios, cria o Card na fase inicial ("Novos Leads"), dispara a automacao `CARD_CREATED` (ex: atribui SDR e envia e-mail de boas-vindas) e emite webhook `card.created`.
2. **Trabalho do Vendedor:** O vendedor visualiza o lead no Kanban com tags de prioridade e SLA. Ao arrastar para "Qualificacao", os campos da fase sao abertos (BANT).
3. **Avanco e Fechamento:** Ao mover para "Proposta Enviada", o valor do negocio e validado. Ao mover para "Fechado Ganho", uma automacao insere o cliente automaticamente na Database de Clientes Ativos.

## 5. Tratamento de Erros e Resiliencia
- Validacoes de schema no client e server com Zod.
- Protecao contra transicoes invalidas (ex: pular fase sem preencher campo obrigatorio).
- Logging estruturado de execucoes de automacao e entregas de webhook com status code e payload.
- Fallback elegante para formularios offline e feedback visual imediato (Toasts).

## 6. Estrategia de Testes e Verificacao
- **Testes Unitarios e de Integracao (Vitest):**
  - CRUD de Pipes, Fases e Cards.
  - Validacao de campos obrigatorios por fase.
  - Execucao de Automacoes (Gatilho -> Condicao -> Acao).
  - Calculo de SLA e metricas de relatorio.
  - Rotas de API REST e geracao de webhooks.
- **Testes End-to-End via `agent-browser`:**
  - Carregamento da pagina de login e criacao de conta/workspace.
  - Navegacao no Kanban de leads, criacao e movimentacao de card entre fases.
  - Abertura de card, adicao de checklist e comentario.
  - Acesso ao formulario publico, submissao de lead e confirmacao de criacao no pipe.
  - Visualizacao do dashboard de relatorios com metricas de conversao.
  - Captura de screenshots em cada etapa para auditoria visual.
