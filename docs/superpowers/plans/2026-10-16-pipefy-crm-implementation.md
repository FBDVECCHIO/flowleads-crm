# FlowLeads CRM (Pipefy Parity) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um CRM completo de gestao de leads com paridade funcional ao Pipefy, incluindo Kanban dinamico, campos customizados por fase, regras de obrigatoriedade, SLAs, motor de automacoes no-code, formularios publicos de captura, databases relacionais, relatorios/dashboards de funil, API REST e webhooks.

**Architecture:** Next.js 15 App Router + TypeScript + Tailwind CSS + Prisma ORM sobre SQLite local. Camada de servicos modular (PipeService, CardService, AutomationEngine, SlaEngine, WebhookDispatcher) desacoplada dos Server Components e Route Handlers.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide React, Prisma, SQLite, bcryptjs, Vitest, agent-browser CLI.

**Spec:** `docs/superpowers/specs/2026-10-16-pipefy-crm-design.md`

## Global Constraints
- Codigo 100% tipado em TypeScript sem `any` desnecessario.
- Zero dependencias externas pesadas nao controladas: roda 100% local sem servicos pagos.
- Todas as rotas de API devem responder em JSON estruturado com status HTTP semanticos.
- Design responsivo, moderno e fiel a ergonomia de trabalho do Pipefy (badges, fases coloridas, kanban fluido, drawers laterais).

---

### Task 1: Scaffolding do Projeto e Configuracao Base
**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `next.config.mjs`, `src/app/globals.css`, `src/app/layout.tsx`
- Test: Build e verificacao de dependencias

- [ ] **Step 1: Criar package.json e instalar dependencias**
- [ ] **Step 2: Configurar TypeScript, Tailwind CSS e Next.js**
- [ ] **Step 3: Verificar compilacao basica**
- [ ] **Step 4: Commit das configuracoes base**

### Task 2: Schema Prisma, Migracoes e Seed do CRM de Vendas
**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`
- Test: `npx prisma db push`, `npx prisma db seed`

- [ ] **Step 1: Escrever prisma/schema.prisma completo**
- [ ] **Step 2: Gerar cliente Prisma e aplicar schema no dev.db**
- [ ] **Step 3: Criar seed completo com template de CRM de Vendas e Leads**
- [ ] **Step 4: Executar seed e verificar dados criados no banco**
- [ ] **Step 5: Commit do schema e seed**

### Task 3: Servicos de Dominio e Camada de Negocio
**Files:**
- Create: `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/services/pipeService.ts`, `src/services/cardService.ts`, `src/services/slaService.ts`
- Test: `tests/services.test.ts`

- [ ] **Step 1: Implementar prisma client singleton e utilitarios de auth/sessao**
- [ ] **Step 2: Implementar PipeService (listar pipes, fases, campos, criar pipe)**
- [ ] **Step 3: Implementar CardService (criar card, mover entre fases com validacao de campos obrigatorios)**
- [ ] **Step 4: Implementar SlaService (calculo de tempo de fase e status de SLA)**
- [ ] **Step 5: Escrever e rodar testes unitarios dos servicos**
- [ ] **Step 6: Commit da camada de servicos**

### Task 4: Motor de Automacoes No-Code e Webhooks
**Files:**
- Create: `src/services/automationEngine.ts`, `src/services/webhookDispatcher.ts`, `src/services/emailOutbox.ts`
- Test: `tests/automation.test.ts`

- [ ] **Step 1: Implementar WebhookDispatcher e EmailOutbox (simulado com log e historico)**
- [ ] **Step 2: Implementar AutomationEngine com suporte a gatilhos (CARD_CREATED, CARD_MOVED, FIELD_UPDATED) e acoes (MOVE_CARD, UPDATE_FIELD, ASSIGN_USER, SEND_EMAIL, TRIGGER_WEBHOOK)**
- [ ] **Step 3: Integrar disparos automaticos nas operacoes de CardService**
- [ ] **Step 4: Escrever e rodar testes do motor de automacoes**
- [ ] **Step 5: Commit do motor de automacoes**

### Task 5: API REST Completa
**Files:**
- Create: `src/app/api/auth/[...action]/route.ts`, `src/app/api/pipes/route.ts`, `src/app/api/pipes/[id]/route.ts`, `src/app/api/cards/route.ts`, `src/app/api/cards/[id]/route.ts`, `src/app/api/cards/[id]/move/route.ts`, `src/app/api/public-form/[slug]/route.ts`, `src/app/api/automations/route.ts`, `src/app/api/database/route.ts`, `src/app/api/reports/route.ts`
- Test: `tests/api.test.ts`

- [ ] **Step 1: Implementar rotas de autenticacao e sessao**
- [ ] **Step 2: Implementar rotas de Pipes, Fases e Campos**
- [ ] **Step 3: Implementar rotas de Cards, criacao, edicao e movimentacao com automacoes**
- [ ] **Step 4: Implementar rota publica de submissao de leads sem autenticacao**
- [ ] **Step 5: Implementar rotas de Relatorios, Automacoes e Database**
- [ ] **Step 6: Testar endpoints de API via testes de integracao**
- [ ] **Step 7: Commit das rotas da API**

### Task 6: UI Shell, Navegacao, Workspaces e Autenticacao
**Files:**
- Create: `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`, `src/app/page.tsx`
- Test: Renderizacao do layout e login no browser

- [ ] **Step 1: Criar componentes de layout e tema no estilo visual Pipefy**
- [ ] **Step 2: Implementar telas de Login e Registro com troca de workspace**
- [ ] **Step 3: Implementar Dashboard inicial com lista de Pipes e atalhos rapidos**
- [ ] **Step 4: Commit da UI base**

### Task 7: Quadro Kanban Completo de Leads
**Files:**
- Create: `src/components/kanban/KanbanBoard.tsx`, `src/components/kanban/KanbanColumn.tsx`, `src/components/kanban/CardItem.tsx`, `src/app/pipes/[id]/page.tsx`
- Test: Visualizacao e navegacao no Kanban

- [ ] **Step 1: Criar componentes do Kanban com colunas por fase, contadores de cards e cores**
- [ ] **Step 2: Implementar CardItem com badges de prioridade, etiquetas, due date, responsavel e alerta de SLA**
- [ ] **Step 3: Adicionar suporte a movimentacao de cards (drag-and-drop e botoes rapidos de transicao)**
- [ ] **Step 4: Conectar com API de movimentacao e atualizar estado reativamente**
- [ ] **Step 5: Commit do Kanban**

### Task 8: Modal / Drawer de Detalhes do Lead (Card Modal)
**Files:**
- Create: `src/components/card/CardDrawer.tsx`, `src/components/card/FieldRenderer.tsx`, `src/components/card/ChecklistSection.tsx`, `src/components/card/ActivityTimeline.tsx`
- Test: Abertura e edicao completa de card

- [ ] **Step 1: Criar CardDrawer com abas de Dados, Checklists e Historico**
- [ ] **Step 2: Implementar FieldRenderer dinamico para todos os tipos de campos suportados**
- [ ] **Step 3: Implementar secao de Checklists com barra de progresso**
- [ ] **Step 4: Implementar secao de Comentarios e Historico de Atividades**
- [ ] **Step 5: Commit do CardDrawer**

### Task 9: Visualizacoes Alternativas: Lista e Tabela (Table View)
**Files:**
- Create: `src/components/views/ListView.tsx`, `src/components/views/TableView.tsx`, `src/components/views/ViewSelector.tsx`
- Test: Alternancia de visualizacao e exportacao CSV

- [ ] **Step 1: Implementar ViewSelector (Kanban, Lista, Tabela)**
- [ ] **Step 2: Implementar ListView com agrupamento por fase**
- [ ] **Step 3: Implementar TableView com busca, ordenacao e exportacao para CSV**
- [ ] **Step 4: Commit das views alternativas**

### Task 10: Formulario Publico de Captura de Leads
**Files:**
- Create: `src/app/public/forms/[slug]/page.tsx`, `src/components/form/PublicLeadForm.tsx`
- Test: Acesso externo e submissao de lead sem autenticacao

- [ ] **Step 1: Criar pagina publica limpa e responsiva do formulario de leads**
- [ ] **Step 2: Renderizar campos configurados no Start Form com validacao em tempo real**
- [ ] **Step 3: Submeter via API publica, exibir tela de sucesso e criar card no pipe**
- [ ] **Step 4: Commit do formulario publico**

### Task 11: Modulo de Automacoes No-Code (UI)
**Files:**
- Create: `src/app/pipes/[id]/automations/page.tsx`, `src/components/automations/AutomationList.tsx`, `src/components/automations/AutomationModal.tsx`
- Test: Criacao e listagem de automacoes

- [ ] **Step 1: Implementar listagem de automacoes ativas com switch on/off**
- [ ] **Step 2: Implementar modal construtor de regras (Quando X acontecer -> Se condicao Y -> Faca Z)**
- [ ] **Step 3: Integrar criacao e edicao com API de automacoes**
- [ ] **Step 4: Commit da UI de automacoes**

### Task 12: Modulo Database Relacional
**Files:**
- Create: `src/app/database/page.tsx`, `src/components/database/TableManager.tsx`, `src/components/database/RecordModal.tsx`
- Test: Criacao de tabelas e registros

- [ ] **Step 1: Implementar interface de tabelas relacionais (Clientes, Empresas, Produtos)**
- [ ] **Step 2: Implementar CRUD de registros com campos customizados**
- [ ] **Step 3: Commit do modulo database**

### Task 13: Modulo de Relatorios e Metricas de Funil
**Files:**
- Create: `src/app/pipes/[id]/reports/page.tsx`, `src/components/reports/FunnelChart.tsx`, `src/components/reports/MetricsGrid.tsx`
- Test: Renderizacao do funil e metricas

- [ ] **Step 1: Implementar painel com KPIs (Total de Leads, Taxa de Conversao, Ticket Medio, Tempo Medio de Ciclo)**
- [ ] **Step 2: Implementar grafico visual do Funil de Vendas por Fase**
- [ ] **Step 3: Implementar tabela de distribuicao de leads por responsavel e status de SLA**
- [ ] **Step 4: Commit do modulo de relatorios**

### Task 14: Bateria de Testes Automatizados Unitarios e de Integracao
**Files:**
- Create: `tests/full-flow.test.ts`
- Test: Execucao completa via Vitest

- [ ] **Step 1: Escrever testes cobrindo fluxo ponta a ponta (criacao de lead -> automacao -> movimentacao -> fechamento ganho)**
- [ ] **Step 2: Executar suite de testes e validar 100% de sucesso**
- [ ] **Step 3: Commit dos testes**

### Task 15: Validacao End-to-End no Frontend com agent-browser
**Files:**
- Create: `docs/verification-report.md`, screenshots em `docs/screenshots/`
- Test: Execucao do servidor e navegacao automatizada com `agent-browser`

- [ ] **Step 1: Iniciar aplicacao Next.js em segundo plano**
- [ ] **Step 2: Usar agent-browser para navegar na tela de login e entrar no sistema**
- [ ] **Step 3: Navegar pelo Kanban de CRM de Leads, mover cards e capturar screenshot**
- [ ] **Step 4: Abrir CardDrawer, editar dados, marcar checklist e capturar screenshot**
- [ ] **Step 5: Acessar Formulario Publico de Leads, preencher, enviar e validar criacao no Kanban**
- [ ] **Step 6: Navegar para Relatorios de Funil e Database e capturar screenshots**
- [ ] **Step 7: Compilar relatorio de verificacao e walkthrough final**
