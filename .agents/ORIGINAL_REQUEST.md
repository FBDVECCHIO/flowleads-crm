# Original User Request

## Initial Request — 2026-10-16T21:01:40Z

Reestruturação do CRM para a marca própria "FlowLeads by Grupo Mário Neto", com painel de Gestão de Metas como tela inicial padrão, controle rigoroso de jornada de acesso (dias/horários), distribuição de leads da Meta Ads por WhatsApp de vendedores, Kanban interativo avançado (cores, movimentação direta, anexos e tags restritas), remodelagem de layout com Sidebar dinâmica e segurança de nível corporativo.

Working directory: C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm
Integrity mode: development

## Requirements

### R1. Rebranding Total & Arquitetura Visual (Layout)
- Eliminar completamente qualquer menção à marca "Pipefy" ou "Acme Corp Brasil".
- Identidade visual oficial: "FlowLeads by Grupo Mário Neto".
- Migrar elementos do cabeçalho superior para o menu lateral esquerdo (Sidebar).
- Implementar divisória dinâmica colapsável (toggle expandir/encolher); quando encolhido, exibir exclusivamente os ícones funcionais com tooltips explicativos.
- Ocultar o menu "Database de Clientes" e simplificar a navegação comercial.

### R2. Gestão de Metas & Controle de Acesso por Horário/Dias (RBAC Avançado)
- Tela padrão de abertura pós-login: Menu "Gestão de Metas" com saudação personalizada "Bem-vindo - [Nome do Usuário]" e termômetro/barra de progresso da meta individual/equipe.
- Nível Supervisor (Master):
  - Gestão de equipe, criação de usuários, senhas e definição de metas financeiras/quantitativas.
  - Definição granular de permissões de menu por camada para cada usuário.
  - Vínculo do número de WhatsApp do vendedor para roteamento e metrificação com contas de anúncio da Meta.
  - Controle de jornada de trabalho: parametrização de dias permitidos (ex: Seg-Sex) e faixas de horário (ex: 08:00 às 18:00) para acesso de usuários convencionais.
- Nível Vendedor/Operador:
  - Acesso estritamente restrito a: Gestão de Metas, Kanban de Leads e Relatórios & Funil.
  - Bloqueio automático de autenticação fora da janela autorizada pelo Supervisor.

### R3. Kanban Comercial Aprimorado & Menu Contextual de Lead
- Operações diretas no quadro: criação rápida de lead e exclusão (com confirmação e permissão).
- Menu contextual de ações rápidas (três pontinhos no canto superior direito do card):
  - Seletor de cor do card para categorização visual imediata.
  - Ação "Mover para..." com listagem direta de todas as fases do funil.
  - Aplicação de Etiquetas (Tags) com regra estrita de governança: criação de novas etiquetas permitida unicamente ao Supervisor.
  - Upload e visualização de anexos (ex: fotos de receitas médicas, propostas, comprovantes).

### R4. Ingestão Automatizada de Leads Meta Ads (Click-to-WhatsApp / Instant Forms)
- Rota de webhook nativa `/api/webhooks/meta` com validação de desafio `hub.challenge` e assinatura criptográfica `x-hub-signature-256`.
- Coleta de dados na Graph API da Meta (`leadgen_id` -> nome, telefone, campanha, conjunto, anúncio e campos de qualificação).
- Criação imediata do card na fase inicial "Novo Lead" e roteamento inteligente para o vendedor responsável baseado no número de WhatsApp da campanha/anúncio.

### R5. Auditoria de Cibersegurança & Prontidão para Deploy em Nuvem
- Criptografia de senhas com salt rounds robustos (bcrypt).
- Proteção contra Session Hijacking e RBAC validado no nível de API Route Handlers.
- Sanitização de arquivos no upload contra execução de payloads maliciosos (MIME type e validação de extensão).
- Preparação de compatibilidade para deploy na Vercel (migração de armazenamento local/SQLite para provedor serverless como Turso/PostgreSQL e storage compatível S3/Blob para anexos).

## Acceptance Criteria

### Rebranding & UI Shell
- [ ] Nenhuma ocorrência de "Pipefy" ou "Acme" visível na interface ou metadados da aplicação.
- [ ] Sidebar dinâmica contrai para apenas ícones e expande mantendo estado persistente no navegador.
- [ ] Cabeçalho superior simplificado, com perfil, organização e status movidos para a Sidebar.

### Gestão de Metas & Restrição de Acesso
- [ ] Ao autenticar, o usuário é direcionado imediatamente para a tela de Metas com mensagem "Bem-vindo - [Nome]".
- [ ] Tentativas de login de usuários comuns fora do horário/dia configurado são rejeitadas com mensagem amigável e código HTTP 403.
- [ ] Supervisor consegue cadastrar metas para cada vendedor e acompanhar ranking/status de atingimento.
- [ ] Cada usuário comum visualiza apenas sua meta pessoal e seu desempenho no funil.

### Kanban & Menu de Ações
- [ ] Botão de três pontinhos no card abre menu com: Alterar Cor, Mover Fase, Aplicar Etiqueta e Anexar Documento.
- [ ] Tentativa de criação de etiqueta por usuário não-supervisor é bloqueada.
- [ ] Arquivo de anexo (ex: receita do cliente) é armazenado com segurança e visualizável no drawer do lead.

### Meta Webhook
- [ ] Simulação de webhook da Meta cria o lead na fase inicial atribuído ao vendedor correto com dados de campanha.
