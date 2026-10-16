# Catalogo Exaustivo de Funcionalidades do Pipefy (CRM & BPM)

## 1. Modulo Pipes e Fases (Processos & Kanban)
- **PIPE-001 (P0)**: Criacao e edicao de Pipes (Nome, descricao, icone, cor).
- **PIPE-002 (P0)**: Visualizacao em Quadro Kanban (colunas verticais por fase).
- **PIPE-003 (P0)**: Visualizacao alternativa em Lista e Tabela (Table View) com busca e filtros.
- **PIPE-004 (P0)**: Criacao, edicao, reordenacao e exclusao de Fases.
- **PIPE-005 (P0)**: Definicao de Fases Finais (Won / Ganho e Lost / Perdido) para fechamento de ciclo.
- **PIPE-006 (P1)**: Regras de Transicao de Fases (Phase jumps / transicoes permitidas).
- **PIPE-007 (P1)**: Configuracao de limite de cards por fase (WIP - Work In Progress limit).

## 2. Modulo Cards (Leads & Oportunidades)
- **CARD-001 (P0)**: Criacao de Card com campos obrigatorios e opcionais.
- **CARD-002 (P0)**: Movimentacao de Card entre fases via Drag-and-Drop ou botao interno.
- **CARD-003 (P0)**: Painel detalhado do Card (Drawer / Modal) com exibicao de todos os dados da fase atual e historico das fases anteriores.
- **CARD-004 (P0)**: Atribuicao de Responsaveis (Assignees / Membros).
- **CARD-005 (P0)**: Etiquetas e Tags coloridas (Labels: Quente, Frio, Prioridade, Enterprise, etc.).
- **CARD-006 (P0)**: Data de Vencimento (Due Date) com alertas visuais (No prazo, Prestes a vencer, Atrasado).
- **CARD-007 (P0)**: Checklists com itens marcaveis e barra de progresso.
- **CARD-008 (P0)**: Historico de Atividades e Auditoria (quem alterou, moveu ou editou).
- **CARD-009 (P1)**: Anexos e arquivos (propostas em PDF, contratos, imagens).
- **CARD-010 (P1)**: Comentarios internos com mencoes (@membro) e timestamps.
- **CARD-011 (P1)**: Cartoes Conectados (relacionamento entre Pipes diferentes, ex.: Lead conectado a Contrato).

## 3. Modulo Tipos de Campos e Formularios Dinamicos
- **FIELD-001 (P0)**: Tipos de campos: Texto Curto, Texto Longo (Markdown), Numero, Moeda (BRL/USD), E-mail, Telefone/WhatsApp, Data, Data/Hora, Selecao Unica (Dropdown/Radio), Multipla Selecao, Checkbox, Link/URL.
- **FIELD-002 (P0)**: Campos exclusivos por Fase (Phase Fields) e Campos Globais do Start Form.
- **FIELD-003 (P0)**: Campos Obrigatorios com validacao antes de permitir avancar de fase.
- **FIELD-004 (P1)**: Campos Condicionais (Exibir campo X somente se campo Y for igual a Z).
- **FIELD-005 (P1)**: Mascaras de entrada (CNPJ, CPF, Telefone).

## 4. Modulo Formularios Publicos (Captura de Leads)
- **FORM-001 (P0)**: Link publico de formulario de entrada para o Pipe (sem exigir login).
- **FORM-002 (P0)**: Customizacao de titulo, descricao, campos visiveis e obrigatorios.
- **FORM-003 (P0)**: Submissao instantanea criando Card na primeira fase do Pipe com notificacao.
- **FORM-004 (P1)**: Modo Embutido (Embed via Iframe/HTML em sites e landing pages).

## 5. Modulo Automacoes No-Code
- **AUTO-001 (P0)**: Motor de Automacoes: Gatilho -> Condicao -> Acao.
- **AUTO-002 (P0)**: Gatilho: Card Criado.
- **AUTO-003 (P0)**: Gatilho: Card Movido para Fase X.
- **AUTO-004 (P0)**: Gatilho: Campo Atualizado.
- **AUTO-005 (P0)**: Acao: Atualizar Campo (ex.: marcar status como Qualificado, atribuir valor).
- **AUTO-006 (P0)**: Acao: Mover Card para Fase Y.
- **AUTO-007 (P0)**: Acao: Atribuir Responsavel (atribuicao automatica ou Round-Robin).
- **AUTO-008 (P1)**: Acao: Enviar E-mail automatico com placeholders dinamicos (ex.: {{card.lead_name}}).
- **AUTO-009 (P1)**: Acao: Disparar Webhook HTTP POST para servico externo.

## 6. Modulo Database (Tabelas Relacionais)
- **DATA-001 (P0)**: Criacao de Tabelas de Dados (ex.: Clientes, Empresas, Catalogo de Produtos).
- **DATA-002 (P0)**: Registros de Tabela com campos customizados.
- **DATA-003 (P1)**: Conexao entre Cards e Registros de Database (lookup de produtos e clientes).

## 7. Modulo SLA e Controle de Prazos
- **SLA-001 (P0)**: Definicao de SLA por Fase (tempo maximo em horas/dias).
- **SLA-002 (P0)**: Alerta visual no Card indicando estouro de SLA (amarelo/vermelho).
- **SLA-003 (P1)**: Metricas de SLA (tempo medio por fase nos relatorios).

## 8. Modulo Relatorios, Metricas e Dashboards
- **REP-001 (P0)**: Dashboard com metricas de Leads (Total de Leads, Taxa de Conversao, Valor em Pipeline).
- **REP-002 (P0)**: Grafico de Funil de Vendas com volume e conversao por fase.
- **REP-003 (P0)**: Tabela de Relatorio com exportacao CSV de leads e oportunidades.
- **REP-004 (P1)**: Desempenho por SDR / Closer (leads atendidos, ganhos e perdidos).

## 9. Modulo Organizacao, Membros e Permissoes
- **ORG-001 (P0)**: Multi-tenancy por Organizacao / Workspace.
- **ORG-002 (P0)**: Controle de Acesso Baseado em Papeis (Admin, Membro, Visualizador).
- **ORG-003 (P0)**: Convite de membros por e-mail e gestao de equipe.

## 10. Modulo Integracoes e API
- **INT-001 (P0)**: API REST completa para criacao, consulta e movimentacao de cards.
- **INT-002 (P0)**: Webhooks de saida (card.created, card.moved, card.updated) com payload estruturado.
- **INT-003 (P1)**: Central de simulacao de E-mails / Outbox para envio e recebimento de mensagens.
