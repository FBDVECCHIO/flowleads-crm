# FlowLeads CRM — Relatório Técnico de Levantamento e Arquitetura: Autenticação, RBAC, Gestão de Metas e Controle de Jornada

**Agente:** `teamwork_preview_explorer_survey_2`  
**Data:** 16 de Outubro de 2026  
**Contexto Operacional:** Protocolo A.T.L.A.S.  
**Alvo:** Reestruturação corporativa do FlowLeads CRM by Grupo Mário Neto  

---

## 1. Sumário Executivo

Uma investigação minuciosa foi conduzida no código-fonte, na camada de dados (Prisma/SQLite) e nas rotas da API do **FlowLeads CRM**. O objetivo foi mapear e desenhar as soluções técnicas para:
1. **Autenticação Segura & Gestão de Sessão**: Correção da vulnerabilidade crítica de sessão em cookie não assinado e implementação de proteção anti-hijacking.
2. **RBAC (Controle de Acesso Baseado em Papéis)**: Diferenciação estrita entre o nível **Supervisor (Master)** e o nível **Vendedor/Operador**, com guardas robustos em rotas de páginas e handlers de API.
3. **Tela Inicial Padrão — Gestão de Metas**: Substituição da tela inicial genérica de listagem de pipes por um painel de metas comercial completo com saudação personalizada (*"Bem-vindo - [Nome]"*), termômetro de atingimento, KPIs de funil e ranking da equipe.
4. **Controle de Jornada de Trabalho (Dias & Horários)**: Bloqueio automático de operadores convencionais fora do horário autorizado (Segunda a Sexta, das 08:00 às 18:00 no fuso de Brasília `America/Sao_Paulo`), com resposta HTTP 403 Forbidden e mensagem amigável explicativa.
5. **Vínculo de WhatsApp de Vendedores**: Associação de números de WhatsApp ao perfil de cada vendedor para atribuição automática e metrificação de leads oriundos de campanhas Meta Ads (Click-to-WhatsApp / Instant Forms).

---

## 2. Diagnóstico Técnico do Estado Atual (As-Is)

### 2.1 Autenticação e Sessão
* **Arquivo:** `src/lib/auth.ts`
  - A interface `SessionUser` armazena apenas `{ id, name, email, role, organizationId }`.
  - A função `authenticateUser(email, passwordPlain)` realiza busca no Prisma e comparação via `bcrypt.compare`.
  - A função `getDefaultUser()` retorna indiscriminadamente o primeiro usuário da base (`prisma.user.findFirst()`).
* **Rota:** `src/app/api/auth/login/route.ts`
  - **Vulnerabilidade Crítica de Segurança:**
    ```ts
    // Linha 17-19:
    res.headers.set(
      "Set-Cookie",
      `flowleads_session=${encodeURIComponent(JSON.stringify(user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    );
    ```
    O cookie de sessão armazena o objeto do usuário em **JSON puro (plaintext)** sem qualquer assinatura criptográfica (HMAC ou JWT). Qualquer agente mal-intencionado pode forjar um cookie contendo `role: "ADMIN"` ou qualquer ID de usuário arbitrário, obtendo escalação de privilégios imediata.
* **Rota:** `src/app/api/auth/me/route.ts`
  - Ignora completamente o cookie da requisição! Executa `const user = await getDefaultUser();` e devolve sempre o usuário administrador inicial da base.
* **Frontend:** `src/app/auth/login/page.tsx`
  - Contém menção explícita residual a *"Paridade Funcional e Experiência Pipefy"* (Linha 53).
  - Após autenticação, redireciona cegamente para `router.push("/")`.

### 2.2 RBAC e Proteção de Rotas
* **Prisma Schema (`prisma/schema.prisma`):**
  - Modelo `User` possui apenas `role String @default("MEMBER")`. Os papéis descritos em comentário são `ADMIN, MEMBER, VIEWER`.
  - Não há diferenciação entre `SUPERVISOR` e `OPERADOR/VENDEDOR`.
* **Guardas de API e Rotas:**
  - **Zero proteção nas rotas de API:** Endpoints como `GET /api/cards`, `POST /api/cards`, `GET /api/reports`, `GET /api/automations` e `POST /api/automations/[id]/toggle` não validam sessão nem permissões. Qualquer cliente HTTP externo pode interagir com o CRM sem credenciais.
  - **Zero proteção em páginas Next.js:** Não há `middleware.ts` no projeto. Páginas como `/pipes/[id]`, `/pipes/[id]/automations` e `/database` carregam livremente no navegador. Operadores conseguem acessar e desligar automações sem nenhuma barreira.

### 2.3 Tela Inicial Atual (Landing Page)
* **Arquivo:** `src/app/page.tsx`
  - É uma página estática/servidor que renderiza um banner de boas-vindas com dados estáticos:
    - `userName="Gestor Comercial"`
    - `orgName="Acme Corp Brasil"`
    - Subtítulo: *"Pipefy Architecture & Complete CRM Engine"*.
  - Exibe apenas uma grade de pipes cadastrados no banco (`pipes.map(...)`).
  - Não existe tela de Metas, termômetro visual ou ranking no sistema atual.

### 2.4 Restrição de Dias e Horários de Trabalho (Jornada)
* **Evidência Prática Obtida no Teste em Tempo Real:**
  - Foi executada requisição `POST /api/auth/login` com as credenciais de `carlos@flowleads.com` (papel `MEMBER`) às **18:11:34** (após o horário limite de 18:00).
  - **Resultado:** A autenticação foi aprovada com sucesso (`{ success: true, user: ... }`).
  - **Conclusão:** O sistema não possui validação de dia da semana ou janela de horário. O vendedor comum consegue operar livremente em horários não autorizados, violando as regras trabalhistas e de governança corporativa estipuladas no requisito R2.

### 2.5 Vínculo de WhatsApp de Vendedores
* O modelo `User` não dispõe de colunas para número de telefone ou WhatsApp.
* As rotas de cards e webhooks não possuem lógica de distribuição baseada no WhatsApp de campanha da Meta.

---

## 3. Arquitetura Técnica Proposta (To-Be)

### 3.1 Criptografia e Proteção Anti-Hijacking de Sessão
Para garantir conformidade com o requisito R5 (*Auditoria de Cibersegurança & Prontidão para Deploy em Nuvem*), a emissão do cookie `flowleads_session` deve ser assinada criptograficamente via HMAC-SHA256, sem necessidade de bibliotecas pesadas de terceiros (utilizando o módulo nativo `crypto` do Node.js).

#### Estrutura do Token de Sessão:
$$\text{Token} = \text{Base64Url}(\text{Payload}) + "." + \text{HMAC-SHA256}(\text{Base64Url}(\text{Payload}), \text{SESSION\_SECRET})$$

```typescript
export interface SessionPayload {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPERVISOR" | "MEMBER" | "OPERADOR";
  organizationId: string;
  exp: number; // Unix timestamp de expiração (7 dias)
}
```

#### Mecanismos de Proteção Implementados:
1. **Assinatura Criptográfica:** O servidor rejeita qualquer cookie cujo HMAC não confira com o segredo da aplicação (`SESSION_SECRET`), impedindo a adulteração de ID ou papel (*Privilege Escalation*).
2. **Flags de Cookie Seguras:** `HttpOnly; SameSite=Lax; Path=/; Max-Age=604800` (e `Secure` em ambiente de produção).
3. **Endpoint `/api/auth/logout`:** Permite encerrar a sessão de forma explícita no cliente e no servidor limpando o cookie (`Max-Age=0`).

---

### 3.2 Matriz de RBAC e Guardas de API

A hierarquia de permissões é estritamente segregada entre dois perfis operacionais:

| Recurso / Funcionalidade | Supervisor (Master / Admin) | Operador (Vendedor) | Comportamento para Operador |
|---|:---:|:---:|---|
| **Gestão de Metas (Tela Padrão)** | Leitura e Edição Geral | Leitura Pessoal | Visualiza sua meta pessoal e seu desempenho no funil |
| **Kanban de Leads** | Acesso Total | Acesso Operacional | Visualiza e move leads sob sua responsabilidade |
| **Relatórios & Funil Comercial** | Acesso Total | Acesso ao Funil | Visualiza KPIs gerais e métricas de conversão |
| **Gestão de Equipe & Usuários** | Permissão Total | Bloqueado | Redirecionamento ou HTTP 403 Forbidden |
| **Configuração de Metas da Equipe** | Permissão Total | Bloqueado | Somente Supervisor define metas |
| **Parametrização de Jornada** | Permissão Total | Bloqueado | Somente Supervisor altera horários/dias |
| **Automações No-Code** | Permissão Total | Bloqueado | Oculto da navegação e bloqueado com 403 |
| **Criação de Novas Etiquetas (Tags)** | Permissão Total | Bloqueado | Somente Supervisor cria novas tags |
| **Database de Clientes** | Oculto (R1) | Oculto (R1) | Oculto do menu lateral de navegação |

#### Implementação do Guarda de API Centralizado (`src/lib/auth.ts`):
```typescript
export async function requireAuth(req: Request, requiredRoles?: string[]) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return { error: Response.json({ error: "Sessão expirada ou não autenticada." }, { status: 401 }) };
  }

  // Se não for Supervisor/Admin, validar janela de trabalho
  if (session.role !== "ADMIN" && session.role !== "SUPERVISOR") {
    const scheduleCheck = await verifyUserSchedule(session.id);
    if (!scheduleCheck.allowed) {
      return {
        error: Response.json({
          error: scheduleCheck.friendlyMessage,
          code: "OUTSIDE_WORK_HOURS"
        }, { status: 403 })
      };
    }
  }

  // Validação de papéis requeridos
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(session.role)) {
    return {
      error: Response.json({ error: "Acesso não autorizado para o seu perfil." }, { status: 403 })
    };
  }

  return { session };
}
```

---

### 3.3 Tela Inicial Padrão: Gestão de Metas

A página `/` (`src/app/page.tsx`) passará a ser o **Painel Oficial de Gestão de Metas**, substituindo a antiga listagem genérica.

#### 1. Saudação Personalizada:
- Exibição de destaque: `"Bem-vindo - [Nome do Usuário]"` (ex: *"Bem-vindo - Carlos SDR"* ou *"Bem-vindo - Gestor Comercial"*).
- Badge dinâmico de período: `"Ciclo Vigente: Outubro de 2026"` e status do expediente (`"Expediente Comercial Ativo"`).

#### 2. Termômetro Visual de Metas:
- **Cálculo de Atingimento:**
  $$\% \text{ Atingido} = \left( \frac{\text{Valor Realizado (Won)}}{\text{Meta Mensal}} \right) \times 100$$
- Barra de progresso contínua com gradiente térmico de alto impacto visual:
  - `< 50%`: Vermelho suave (`#ef4444`) — *Abaixo do Ritmo*
  - `50% - 79%`: Amarelo/Âmbar (`#f59e0b`) — *Em Evolução*
  - `80% - 99%`: Azul corporativo (`#3b82f6`) — *Próximo da Meta*
  - `≥ 100%`: Esmeralda vibrante (`#10b981`) — *Meta Batida! 🚀*
  - `≥ 120%`: Roxo gradiente (`#8b5cf6`) — *Supermeta Atingida 👑*
- Marcadores de marco em 25%, 50%, 75% e 100%.

#### 3. Cards de Métricas Comerciais (KPIs):
- **Meta Mensal Financeira:** Valor estipulado pelo Supervisor (ex: `R$ 100.000,00`).
- **Realizado no Mês (Fechado Ganho):** Soma do `dealValue` dos cards na fase com `isFinalWon = true` atribuídos ao usuário.
- **Faltante para Atingir a Meta:** `max(0, Meta - Realizado)`.
- **Pipeline em Aberto:** Soma dos leads ativos em fases intermediárias (potencial de fechamento).
- **Meta Quantitativa de Vendas:** Negócios fechados vs. meta de volume (ex: 8 de 10 negócios fechados).

#### 4. Ranking de Vendedores e Governança de Visualização:
- **Supervisor:** Painel analítico de ranking com todos os operadores, percentuais de atingimento, valor vendido, status de WhatsApp e botão de ação rápida para redefinir metas individuais.
- **Operador/Vendedor:** Exibição focada na sua meta individual e seu posicionamento relativo (ex: *"Você ocupa o 1º lugar da equipe neste mês!"*), mantendo a confidencialidade e estimulando o foco comercial.

---

### 3.4 Controle de Jornada de Trabalho (Restrição de Dias e Horários)

O controle de expediente é configurável pelo Supervisor e garante que operadores não acessem o CRM fora dos dias e horários estipulados.

#### Parâmetros Padrão do Sistema:
- **Dias Permitidos:** Segunda a Sexta-feira (`1,2,3,4,5`).
- **Janela de Horário:** `08:00` às `18:00`.
- **Fuso Horário Obrigatório:** `America/Sao_Paulo` (Horário de Brasília, UTC-3).

#### Lógica de Decisão e Validação:
```typescript
export interface ScheduleCheck {
  allowed: boolean;
  code?: string;
  friendlyMessage?: string;
}

export function checkScheduleAccess(user: {
  role: string;
  allowedDays?: string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  scheduleRestricted?: boolean;
}): ScheduleCheck {
  // Administradores e Supervisores têm acesso irrestrito 24/7
  if (user.role === "ADMIN" || user.role === "SUPERVISOR") {
    return { allowed: true };
  }

  if (user.scheduleRestricted === false) {
    return { allowed: true };
  }

  const allowedDays = (user.allowedDays || "1,2,3,4,5")
    .split(",")
    .map((d) => parseInt(d.trim(), 10));
  const startTime = user.workStartTime || "08:00";
  const endTime = user.workEndTime || "18:00";

  // Obter hora exata no Fuso Horário de Brasília (America/Sao_Paulo)
  const now = new Date();
  const spDateStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  const spDate = new Date(spDateStr);

  const currentDay = spDate.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const currentMinutes = spDate.getHours() * 60 + spDate.getMinutes();

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const dayNames = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
    "Quinta-feira", "Sexta-feira", "Sábado"
  ];

  // 1. Verificação do Dia da Semana
  if (!allowedDays.includes(currentDay)) {
    return {
      allowed: false,
      code: "OUTSIDE_WORK_DAYS",
      friendlyMessage: `Acesso bloqueado: Hoje (${dayNames[currentDay]}) não é um dia autorizado para acesso à plataforma. Seu expediente está configurado de Segunda a Sexta-feira. Em caso de necessidade extraordinária, contate seu supervisor.`,
    };
  }

  // 2. Verificação da Faixa de Horário
  if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
    const formattedHour = `${String(spDate.getHours()).padStart(2, "0")}:${String(spDate.getMinutes()).padStart(2, "0")}`;
    return {
      allowed: false,
      code: "OUTSIDE_WORK_HOURS",
      friendlyMessage: `Acesso bloqueado: O horário atual (${formattedHour}) está fora da jornada de trabalho autorizada (${startTime} às ${endTime}). O acesso ao FlowLeads permanecerá suspenso até o início do próximo expediente.`,
    };
  }

  return { allowed: true };
}
```

#### Tratamento de Resposta no Login (`POST /api/auth/login`):
Se a validação falhar:
- **Status HTTP:** `403 Forbidden`
- **Corpo da Resposta JSON:**
  ```json
  {
    "error": "Acesso bloqueado: O horário atual (18:11) está fora da jornada de trabalho autorizada (08:00 às 18:00). O acesso ao FlowLeads permanecerá suspenso até o início do próximo expediente.",
    "code": "OUTSIDE_WORK_HOURS",
    "allowedWindow": {
      "days": "Segunda a Sexta-feira",
      "hours": "08:00 às 18:00"
    }
  }
  ```
- **Na Interface de Login (`src/app/auth/login/page.tsx`):**
  Um card de alerta especial é exibido com ícone de relógio (`Clock`) e escudo (`ShieldAlert`), explicando ao colaborador de forma amigável as normas corporativas e o horário permitido.

---

### 3.5 Vínculo de WhatsApp de Vendedores e Roteamento Meta Ads

#### 1. Extensão do Modelo `User`:
- `whatsappNumber`: `String?` (ex: `"+5511988887777"`).
- `whatsappActive`: `Boolean @default(true)`.

#### 2. Lógica de Roteamento Inteligente:
Quando um lead entra via Meta Webhook (`POST /api/webhooks/meta`):
1. O webhook extrai dados da campanha, conjunto de anúncios ou número de destino da Meta.
2. O sistema realiza busca pelo vendedor cujo `whatsappNumber` corresponda ao número de destino vinculado na campanha.
3. Se nenhum vendedor tiver o número específico da campanha, é acionado o algoritmo de **Round-Robin Comercial** entre os operadores que estiverem com `whatsappActive: true` e dentro de sua jornada de trabalho.
4. O card é automaticamente criado na fase inicial (`Novos Leads`) e o vendedor é associado via `CardAssignee`.

#### 3. Painel de Gestão da Equipe (Módulo do Supervisor):
Disponível em rota protegida do Supervisor (`/admin/team` ou modal de equipe), permitindo:
- Criar novos operadores com senha inicial.
- Definir e editar o WhatsApp de cada vendedor com botão para envio de teste via `wa.me/`.
- Definir as metas mensais financeiras e quantitativas.
- Customizar dias permitidos e faixa horária de expediente.

---

### 3.6 Especificação de Alterações no Schema do Prisma (`prisma/schema.prisma`)

```prisma
// ==========================================
// MODEL: User (Campos adicionados para RBAC, Metas e Jornada)
// ==========================================
model User {
  id             String       @id @default(cuid())
  organizationId String
  name           String
  email          String       @unique
  passwordHash   String
  role           String       @default("MEMBER") // ADMIN, SUPERVISOR, MEMBER, OPERADOR
  avatarUrl      String?
  createdAt      DateTime     @default(now())

  // Vínculo comercial e WhatsApp
  whatsappNumber String?      // Ex: "+5511988887777"
  whatsappActive Boolean      @default(true)

  // Controle de Jornada de Trabalho
  allowedDays        String?  @default("1,2,3,4,5") // Seg a Sex
  workStartTime      String?  @default("08:00")     // 08:00
  workEndTime        String?  @default("18:00")     // 18:00
  scheduleRestricted Boolean  @default(true)        // False para Supervisor/Admin

  // Metas Comerciais Padrão
  monthlyTargetAmount Float?  @default(100000)      // R$ 100.000,00
  monthlyTargetDeals  Int?    @default(10)          // 10 negócios

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  assignees CardAssignee[]
  comments  CardComment[]
  createdCards Card[] @relation("CardCreator")
  salesGoals SalesGoal[]
}

// ==========================================
// NOVO MODEL: SalesGoal (Histórico e granularidade mensal de metas)
// ==========================================
model SalesGoal {
  id           String   @id @default(cuid())
  userId       String
  month        Int      // 1 a 12
  year         Int      // Ex: 2026
  targetAmount Float    @default(100000)
  targetDeals  Int      @default(10)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, month, year])
}
```

---

## 4. Plano Detalhado de Implementação e Arquitetura de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `prisma/schema.prisma` | Modificar | Adicionar campos de jornada, WhatsApp e metas ao modelo `User`; criar model `SalesGoal`. |
| `prisma/seed.ts` | Atualizar | Configurar usuários iniciais com WhatsApp, metas e regras de jornada; eliminar termos "Acme" e "Pipefy". |
| `src/lib/auth.ts` | Refatorar | Implementar assinatura e verificação HMAC de tokens de sessão, `requireAuth`, `checkScheduleAccess` e `getServerSession`. |
| `src/app/api/auth/login/route.ts` | Refatorar | Validar credenciais, checar jornada de trabalho com rejeição HTTP 403, emitir cookie assinado. |
| `src/app/api/auth/me/route.ts` | Refatorar | Ler e validar cookie da requisição, devolvendo os dados reais do usuário autenticado. |
| `src/app/api/auth/logout/route.ts` | Criar | Limpar o cookie de sessão `flowleads_session` com `Max-Age=0`. |
| `src/app/api/goals/route.ts` | Criar | Retornar metas, percentual de atingimento, progresso do termômetro e ranking. |
| `src/app/api/team/route.ts` | Criar | CRUD de membros da equipe (Supervisor only): criação de usuário, definição de WhatsApp, jornada e metas. |
| `src/app/page.tsx` | Refatorar | Converter a tela inicial no painel **"Gestão de Metas"** com saudação `"Bem-vindo - [Nome]"`, termômetro e KPIs. |
| `src/components/goals/GoalThermometer.tsx` | Criar | Componente visual do termômetro com gradiente térmico dinâmico e marcadores de atingimento. |
| `src/components/goals/TeamRankingTable.tsx` | Criar | Tabela de ranking da equipe com classificação por vendas e destaque do líder. |
| `src/app/auth/login/page.tsx` | Atualizar | Remover menção ao Pipefy, adicionar tratamento visual para erro 403 de horário de expediente bloqueado. |
| `src/components/layout/Sidebar.tsx` | Atualizar | Adicionar menu "Gestão de Metas" como primeiro item; filtrar itens por papel do usuário. |

---

## 5. Critérios de Aceite e Métodos de Verificação

### Critério 1: Tela Inicial Padrão — Gestão de Metas
- **Comportamento:** Ao efetuar login com Carlos SDR (`carlos@flowleads.com`), a aplicação carrega diretamente `/` exibindo *"Bem-vindo - Carlos SDR"*, termômetro de atingimento com o valor vendido (`R$ 180.000,00`) e a meta individual.
- **Verificação:** Acessar `http://localhost:3000/` autenticado e inspecionar a renderização do cabeçalho e da barra de progresso.

### Critério 2: Rejeição de Acesso Fora do Horário (HTTP 403)
- **Comportamento:** Tentativa de autenticação de vendedor convencional em dias de fim de semana ou fora da janela 08:00-18:00 recebe resposta HTTP 403 com JSON `{ "error": "...", "code": "OUTSIDE_WORK_HOURS" }`.
- **Verificação:** Executar chamada POST via curl ou script em horário noturno:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"carlos@flowleads.com","password":"user123"}'
  ```
  Confirmar que retorna status 403 e que a mensagem amigável é exibida na tela de login.

### Critério 3: Acesso Irrestrito do Supervisor
- **Comportamento:** Tentativa de autenticação de `admin@flowleads.com` a qualquer hora e dia da semana é sempre autorizada com sucesso.
- **Verificação:** Testar login do administrador no mesmo horário noturno e constatar HTTP 200.

### Critério 4: Vínculo de WhatsApp
- **Comportamento:** Usuário vendedor possui `whatsappNumber` persistido no banco de dados e visível na gestão de equipe.
- **Verificação:** Consultar Prisma:
  ```powershell
  node --experimental-strip-types -e "import('./src/lib/prisma.ts').then(async m => { const u = await m.prisma.user.findFirst({ where: { email: 'carlos@flowleads.com' } }); console.log(u.whatsappNumber); process.exit(0); })"
  ```

---

*Relatório de engenharia concluído com êxito sob as diretrizes do Protocolo A.T.L.A.S.*
