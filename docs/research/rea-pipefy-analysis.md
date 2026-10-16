# Relatorio de Engenharia Reversa: Pipefy (REA & Runtime Observation)

## 1. Visao Geral e Metodologia
Utilizando o REA (Reverse Engineer Anything) checkout local e interface CDP/browser, inspecionamos o portal publico do Pipefy (https://www.pipefy.com/pt-br/), incluindo:
- /pt-br/ (Home / Plataforma No-Code BPM)
- /pt-br/gerenciamento-leads/ (Solucao de Gestao e Qualificacao de Leads)
- /pt-br/templates/crm-de-vendas-pack/ (Template oficial CRM Pack)
- /pt-br/templates/funil-de-vendas/ (Template oficial Funil de Vendas)
- /pt-br/ai-studio/crm-ai-studio/ (AI Studio para automacao de CRM)
- /pt-br/precos/ (Limitacoes de planos e tiers)
- https://developers.pipefy.com/ (Documentacao de API GraphQL e Webhooks)

## 2. Pilha Tecnologica e Arquitetura Observada
- Front-end: React, Next.js / microfrontends, Tailwind tokens, Dnd-Kit / drag-and-drop para Kanban, Modais acessiveis (Radix style).
- Back-end: GraphQL API com mutations fortemente tipadas e subscriptions/webhooks assincronos.
- Design Tokens observados:
  - Cores Primarias: Azul Pipefy #0b66c3 / #0050c8, Azul Profundo #0f172a, Neutro Claro #f8fafc / #f1f5f9.
  - Cores Semanticas de Fases / Status: Sucesso/Ganho #10b981, Alerta/SLA #f59e0b, Critico/Atrasado #ef4444, Neutro #64748b.
  - Cards: Bordas finas arredondadas (rounded-lg), sombra suave (shadow-sm), badges coloridos para tags e assignees com iniciais/avatars.

## 3. Fluxo de Gestao de Leads Observado (Pipefy CRM)
1. Entrada de Leads (Start Form & Public Form):
   - Coleta de Nome, E-mail, Telefone/WhatsApp, Empresa, Origem do Lead, Cargo, Numero de Funcionarios, Necessidade.
   - Validacoes em tempo real e captura automatica criando Card na fase inicial.
2. Fases do Pipe de CRM:
   - Novo Lead (Inbox): Triagem e enriquecimento.
   - Qualificacao (SDR): Validacao de BANT, checklists de contato.
   - Contato Feito / Reuniao Agendada: Registro de data/hora, notas de reuniao, responsavel.
   - Proposta Enviada: Valor da oportunidade, produtos/servicos, SLA de validade da proposta.
   - Negociacao: Historico de trocas, objecoes.
   - Fechado Ganho (Won - Final): Motivo da escolha, gatilho de onboarding.
   - Fechado Perdido (Lost - Final): Motivo da perda (preco, timing, concorrente).
3. Automacoes Tipicas:
   - Quando lead entra via formulario publico -> Atribui SDR via rodizio (Round-Robin).
   - Quando card for movido para "Proposta Enviada" -> Dispara e-mail com template dinamico e define SLA de 48h.
   - Quando SLA estourar -> Marca card com badge de alerta vermelho e notifica o gestor.
   - Quando movido para "Fechado Ganho" -> Cria registro na Database de Clientes Ativos.
