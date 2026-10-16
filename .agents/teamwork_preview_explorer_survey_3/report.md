# Relatório de Diagnóstico de Engenharia & Arquitetura Técnica — Survey 3
**Projeto:** FlowLeads CRM by Grupo Mário Neto  
**Agente Responsável:** Teamwork Preview Explorer Survey 3 (A.T.L.A.S. Protocol)  
**Data:** 2026-10-16T21:14:00Z  
**Status:** Análise Estritamente Concluída (Read-Only)

---

## 1. Sumário Executivo & Diagnóstico Global

Após minuciosa inspeção analítica da base de código do **FlowLeads CRM** em C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm, apresento a vossa senhoria o diagnóstico técnico detalhado sobre as cinco frentes solicitadas:
1. **Quadro Comercial Kanban:** O pipeline básico e a validação de regras de movimentação (Pipefy Parity) estão funcionais, porém faltam operações diretas cruciais no quadro (como exclusão com diálogo de confirmação, criação rápida contextual e ações inline nos cards).
2. **Menu Contextual de 3 Pontinhos no Card:** Inexistente no momento. Não há seletor de cores, movimentação direta de fases sem drag-and-drop, gestão de etiquetas com trava de governança para supervisores, nem gerenciamento de anexos (documentos, receitas, propostas).
3. **Ingestão Automatizada de Leads Meta Ads:** Inexistente. A base conta apenas com disparador de webhooks *outbound* (WebhookDispatcher), sem nenhuma rota *inbound* em /api/webhooks/meta, sem verificação de hub.challenge, sem validação criptográfica de x-hub-signature-256, sem integração com Graph API da Meta e sem roteamento por WhatsApp do vendedor.
4. **Postura de Cibersegurança:** Foi detectada uma **vulnerabilidade crítica de integridade de sessão** (lowleads_session gravado em cookie como JSON em texto claro sem assinatura criptográfica), salt rounds de bcrypt fixados no mínimo aceitável (10), inexistência de proteção contra sequestro de sessão (Session Hijacking), ausência de guards de autenticação/RBAC em todos os route handlers de API (/api/cards, /api/cards/[id]/move, etc.) e ausência de pipeline de sanitização de arquivos (magic bytes / MIME).
5. **Prontidão para Banco Serverless & Deploy em Nuvem:** A aplicação encontra-se ancorada em SQLite local (prisma/dev.db), o que gera contenção de concorrência em testes paralelos e incompatibilidade terminal com arquitetura serverless de borda (Vercel Lambdas), exigindo abstração para Turso/PostgreSQL e adapter de storage para S3/Vercel Blob.

---

## 2. Área 1: Quadro Comercial Kanban (Operações, Fases e Exclusão)

### 2.1 Estado Atual da Implementação
- **Componentes Centrais:**
  - src/components/kanban/KanbanColumn.tsx: Renderiza colunas das fases com cabeçalho (cor, nome, badge de contagem de leads, botão de criação rápida se order === 1), somatório de valor e área de drop com suporte a drag-and-drop nativo HTML5.
  - src/components/kanban/CardItem.tsx: Renderiza título, badges de SLA (WARNING, OVERDUE), dealValue formatado em BRL, prioridade, contadores de checklist e comentários, e botão hover "Avançar para [Próxima Fase]".
  - src/app/pipes/[id]/page.tsx: Controla estado dos cards, alternância de visualizações (Kanban, Lista, Tabela), modal de "Novo Lead" e abertura do CardDrawer.
  - src/services/cardService.ts: Lógica de criação (createCard), movimentação (moveCard) e campos (updateCardFields).

### 2.2 Diagnóstico de Lacunas Identificadas

| Recurso Requerido | Situação Atual | Impacto Operacional | Arquitetura Proposta |
|---|---|---|---|
| **Criação Rápida de Lead** | Existe apenas via modal genérico na navbar superior ou botão + na primeira coluna (order === 1). | Criação engessada; não permite preencher vendedor, etiquetas ou cor inicial. | Expandir criação rápida inline ou modal aprimorado pré-preenchendo a fase clicada. |
| **Operações Rápidas Inline** | Limitado ao botão hover "Avançar para [Próxima Fase]". | Se o usuário quiser avançar 2 fases ou voltar, é obrigado a arrastar pelo quadro inteiro. | Implementar menu contextual e atalhos de teclado. |
| **Confirmação de Exclusão** | **Totalmente Inexistente.** Não há botão de deletar em CardItem, KanbanColumn nem CardDrawer. | Impossibilidade de higienização da base comercial. | Criar endpoint DELETE /api/cards/[id], método CardService.deleteCard, diálogo modal de confirmação ("Tem certeza que deseja excluir o lead [Título]?") com validação de permissão de supervisor/dono. |
| **Movimentação de Fases** | Implementado com sucesso em CardService.moveCard, validando campos obrigatórios da fase destino. | Ao arrastar card com campos obrigatórios pendentes via drag-and-drop, a tela emite um lert() nativo simples. | Substituir lert() por modal amigável de preenchimento imediato dos campos pendentes ou abertura automática da gaveta lateral (CardDrawer). |

### 2.3 Código de Exclusão Ausente no Backend
Em src/services/cardService.ts, falta implementar o método de exclusão com auditoria e exclusão em cascata:
`	ypescript
static async deleteCard(cardId: string, userId?: string) {
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Card não encontrado.");

  // Registrar histórico/auditoria se necessário antes da exclusão
  await prisma.card.delete({ where: { id: cardId } });
  return { success: true, deletedId: cardId };
}
`
E no route handler src/app/api/cards/[id]/route.ts:
`	ypescript
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Guard de sessão e permissão (apenas Admin/Supervisor ou Criador)
    const session = await getSessionFromRequest(req);
    if (!session) return Response.json({ error: "Não autorizado." }, { status: 401 });
    
    await CardService.deleteCard(id, session.id);
    return Response.json({ success: true, id });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
`

---

## 3. Área 2: Menu Contextual de 3 Pontinhos no Card

### 3.1 Anatomia do Componente de 3 Pontinhos (CardItem.tsx)
Atualmente, CardItem.tsx possui apenas elementos estáticos de exibição e o botão hover de avançar fase. Para atender ao requisito **R3**, é mandatório adicionar no canto superior direito do card:
- Ícone MoreVertical (Lucide) com menu flutuante (dropdown) acionado por clique, prevenindo a propagação de evento (e.stopPropagation()) para não abrir o CardDrawer acidentalmente.

### 3.2 As 4 Ações Obrigatórias do Menu Contextual

#### A. Seletor de Cores do Card (Color Picker)
- **Objetivo:** Categorização visual imediata (ex: diferenciar leads quentes, parcerias hospitalares, clientes VIP).
- **Alteração de Schema Necessária:** Adicionar campo color no model Card do schema.prisma:
  `prisma
  model Card {
    // ...
    color String? @default("#ffffff") // Cor customizada do card
  }
  `
- **Paleta Recomendada (Presets):**
  - #ffffff (Padrão Branco)
  - #fee2e2 (Vermelho Claro / Crítico)
  - #fef3c7 (Âmbar / Atenção)
  - #dcfce7 (Esmeralda / Alta Probabilidade)
  - #e0e7ff (Índigo / Corporativo)
  - #f3e8ff (Roxo / VIP)
  - #e2e8f0 (Cinza / Frio)
- **Renderização Visual:** Borda lateral esquerda estilizada (order-l-4) ou fundo suave com contraste tipográfico automático.

#### B. Ação "Mover para..." com Listagem Direta de Fases
- **Objetivo:** Mover o card para qualquer fase do funil sem necessidade de drag-and-drop horizontal.
- **Funcionamento:**
  - O submenu lista todas as fases ordenadas (pipe.phases).
  - Fase atual fica desabilitada e destacada.
  - Ao clicar na fase destino: se a fase não possuir campos obrigatórios pendentes, move diretamente com feedback de toast; se possuir campos obrigatórios, abre o CardDrawer na fase correspondente alertando os campos a preencher.

#### C. Gestão de Etiquetas (Tags) com Regra Estrita de Governança
- **Regra de Negócio Crucial (R3):**
  - **Vendedor / Operador:** Pode visualizar as etiquetas existentes no Pipe e marcar/desmarcar etiquetas no card. **Não pode** criar nem excluir etiquetas do sistema.
  - **Supervisor / Administrador:** Tem acesso completo para selecionar etiquetas e criar novas etiquetas (definindo nome e cor).
- **Segurança da Regra no Backend:**
  - Criar endpoint POST /api/pipes/[id]/labels que valida a sessão do usuário. Se session.role !== "ADMIN" && session.role !== "SUPERVISOR", responder com HTTP 403 Forbidden e mensagem: "Apenas supervisores possuem permissão para criar novas etiquetas no catálogo.".
- **Relação de Dados:** Já existe a tabela associativa CardLabel (cardId, labelId) e a tabela Label (id, pipeId, 
ame, color), pronta para ser ativada.

#### D. Upload e Visualização de Anexos (Documentos e Receitas)
- **Cenário de Negócio:** Anexar fotos de receitas médicas, propostas comerciais em PDF, comprovantes de pagamento e diagnósticos.
- **Estrutura de Dados Necessária:** Criar model CardAttachment no Prisma:
  `prisma
  model CardAttachment {
    id           String   @id @default(cuid())
    cardId       String
    fileName     String
    fileSize     Int
    mimeType     String
    storagePath  String   // URL relativa local ou chave no bucket S3/Blob
    uploadedById String?
    createdAt    DateTime @default(now())

    card     Card  @relation(fields: [cardId], references: [id], onDelete: Cascade)
    uploader User? @relation(fields: [uploadedById], references: [id], onDelete: SetNull)
  }
  `
- **Interface:**
  - Opção no menu contextual: "Anexar Arquivo" (abre seletor de arquivos do sistema).
  - Nova aba no CardDrawer: **"Anexos (X)"** com lista de arquivos, miniatura de imagens (com visualizador lightbox), ícone de PDF, tamanho formatado, autor e botão de download seguro.

---

## 4. Área 3: Ingestão de Leads Meta Ads (Click-to-WhatsApp / Instant Forms)

### 4.1 Arquitetura do Endpoint /api/webhooks/meta
Atualmente inexiste qualquer endpoint receptivo de webhook. A rota deve ser implementada em src/app/api/webhooks/meta/route.ts suportando métodos GET e POST.

`
[Meta Platform] 
      │
      ├── (GET Challenge Handshake) ──► Validação de hub.verify_token & hub.challenge
      │
      └── (POST Evento leadgen) ─────► Validação HMAC-SHA256 (x-hub-signature-256)
                                            │
                                            ▼
                                  Graph API Meta (leadgen_id)
                                  Recupera Nome, WhatsApp, Campanha
                                            │
                                            ▼
                                  Criação do Lead no Funil Comercial
                                  Fase: "Novos Leads"
                                            │
                                            ▼
                                  Roteamento Inteligente via WhatsApp
                                  Atribuição de Vendedor (User.whatsappNumber)
`

### 4.2 Verificação do Handshake (GET /api/webhooks/meta)
A Meta exige validação síncrona com os parâmetros hub.mode, hub.verify_token e hub.challenge:
`	ypescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.META_VERIFY_TOKEN || "flowleads_meta_webhook_secret_token";

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  return new Response("Forbidden", { status: 403 });
}
`

### 4.3 Validação Criptográfica de Assinatura (POST /api/webhooks/meta)
A Meta envia o cabeçalho x-hub-signature-256: sha256=<hash_hexadecimal>. A aplicação deve:
1. Obter o corpo bruto da requisição como texto/Buffer (wait req.text()).
2. Calcular o HMAC-SHA256 usando process.env.META_APP_SECRET.
3. Comparar a assinatura calculada com a recebida usando crypto.timingSafeEqual para blindagem contra ataques de temporização (Timing Attacks).

`	ypescript
import crypto from "crypto";

function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const receivedHash = signatureHeader.substring(7);
  const expectedHash = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  } catch {
    return false;
  }
}
`

### 4.4 Coleta de Dados via Graph API & Roteamento Inteligente
- **Payload recebido da Meta:** Contém entry[].changes[].value.leadgen_id, além de campaign_id, d_id, orm_id.
- **Chamada Graph API:**
  GET https://graph.facebook.com/v21.0/?access_token=
  Retorna campos de qualificação estruturados (ield_data: 
ame, email, phone_number, etc.).
- **Roteamento de Vendedor por WhatsApp:**
  - No modelo User, adicionar whatsappNumber String? e ctiveCampaigns String?.
  - Ao receber o lead, o sistema verifica a campanha/anúncio associada e o número de WhatsApp vinculado a ela.
  - O lead é criado imediatamente na primeira fase do Pipe ("Novos Leads") com o campo de origem "Meta Ads (Click-to-WhatsApp)".
  - O vendedor correspondente é atribuído como CardAssignee.
  - Uma atividade (CardActivity) é registrada com os detalhes da campanha, conjunto de anúncios e criativo.

---

## 5. Área 4: Auditoria de Cibersegurança & Prontidão para Produção

### 5.1 Criptografia de Senhas (Bcrypt Salt Rounds)
- **Situação Atual:** Em prisma/seed.ts linhas 39-40, o hash é gerado com crypt.hash("senha", 10).
- **Recomendação de Engenharia:** Conforme diretrizes OWASP e NIST para trabalho de derivação de chaves contra ataques de força bruta com GPUs modernas:
  - Elevar os salt rounds para **12** (const BCRYPT_SALT_ROUNDS = 12).
  - Centralizar a função de hash e comparação no módulo de segurança (src/lib/security.ts).

### 5.2 Vulnerabilidade de Sessão e Proteção Anti-Session Hijacking
- **Falha Crítica Detectada em src/app/api/auth/login/route.ts:18:**
  `	ypescript
  res.headers.set(
    "Set-Cookie",
    lowleads_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
  );
  `
  - O cookie armazena o objeto do usuário codificado em base/URI sem nenhuma assinatura criptográfica (sem HMAC, sem JWT, sem selo de autenticidade).
  - **Vetor de Exploração:** Qualquer usuário pode forjar o valor de lowleads_session com {"id":"qualquer","role":"ADMIN"} e assumir privilégios totais de Administrador/Supervisor instantaneamente.
- **Remediação Arquitetural Imediata:**
  1. **Token Criptografado/Assinado:** Usar HMAC-SHA256 ou JWT assinado com SESSION_SECRET secreto no servidor contendo expiração, timestamp e identificador da sessão.
  2. **Token Binding (Anti-Hijacking):**
     - No momento do login, gerar uma impressão digital do cliente (Client Fingerprint):
       ingerprint = sha256(client_ip + user_agent + SESSION_SECRET).
     - Gravar essa impressão no token da sessão.
     - A cada requisição, recalcular o hash a partir do eq.headers.get("x-forwarded-for") e eq.headers.get("user-agent").
     - Caso haja divergência suspeita (sequestro de cookie por IP/dispositivo distinto), invalidar a sessão imediatamente e retornar HTTP 401.
  3. **Flags Seguras de Cookie:** Adicionar obrigatoriamente a flag Secure quando em ambiente de produção (process.env.NODE_ENV === "production"), mantendo HttpOnly, SameSite=Lax (ou Strict) e Path=/.

### 5.3 Guards de Rotas de API & RBAC
- **Diagnóstico:** As rotas /api/cards, /api/cards/[id]/move, /api/automations, /api/database não possuem verificação de sessão. Uma requisição curl externa sem cookie consegue criar, mover e consultar dados confidenciais de leads.
- **Implementação Recomendada:**
  Criar helper alidateSessionAndRole(req: Request, allowedRoles?: string[]):
  1. Extrair e validar criptograficamente a sessão do cookie.
  2. Verificar controle de jornada de trabalho (dias permitidos e faixa de horário para usuários com perfil Vendedor/MEMBER). Se fora do horário, rejeitar com HTTP 403.
  3. Verificar se o perfil do usuário possui permissão para a ação solicitada.

### 5.4 Sanitização e Proteção no Upload de Arquivos
- **Riscos Identificados:** Execução de scripts remotos (RCE), upload de arquivos executáveis disfarçados e Cross-Site Scripting armazenado (Stored XSS via arquivos SVG maliciosos).
- **Mecanismos de Defesa Obrigatórios:**
  1. **Lista Branca Estrita de Extensões:** .pdf, .jpg, .jpeg, .png, .webp. Bloqueio total de .svg, .html, .exe, .bat, .sh, .php.
  2. **Validação de Tipos MIME Autênticos:** Verificar cabeçalho Content-Type.
  3. **Verificação de Magic Bytes:** Inspecionar os primeiros bytes do buffer do arquivo no servidor para assegurar integridade:
     - PDF: %PDF ( x25 0x50 0x44 0x46)
     - JPEG:  xFF 0xD8 0xFF
     - PNG:  x89 0x50 0x4E 0x47
     - WebP: RIFF....WEBP
  4. **Randomização do Nome do Arquivo:** Jamais gravar o arquivo no disco com o nome enviado pelo cliente. Gerar chave criptográfica: ${cuid()}-.
  5. **Limite de Tamanho:** Restringir uploads a no máximo 10MB por arquivo.

---

## 6. Área 5: Prontidão para Banco Serverless & Deploy em Nuvem (Vercel)

### 6.1 Limitações Críticas do SQLite Local em Ambientes Serverless
- **Efemeridade de Disco:** Plataformas como Vercel e AWS Lambda operam instâncias efêmeras (stateless). Qualquer modificação gravada no arquivo prisma/dev.db é perdida a cada reciclagem de container ou não é compartilhada entre requisições concorrentes em instâncias distintas.
- **Problema de Concorrência de Escrita (Locks):**
  - Durante o diagnóstico da suíte de testes com 
ode --test tests/*.test.ts, confirmamos experimentalmente que a execução concorrente de múltiplos testes disparou falhas de asserção devido a colisões de escrita no arquivo SQLite único.
  - Ao executar os testes sequencialmente com --test-concurrency=1, a suíte alcançou **100% de aprovação (7/7)**.

### 6.2 Estratégia de Migração para Banco de Dados Serverless
Para garantir 100% de prontidão para deploy na Vercel:
1. **Opção Recomendada A (libSQL / Turso):**
   - Mantém paridade com a sintaxe SQLite sem necessidade de alterar tipos complexos.
   - Conexão via protocolo HTTP/WebSocket distribuído compatível com Vercel Edge e Lambdas.
   - Provider Prisma: @prisma/adapter-libsql.
2. **Opção Recomendada B (PostgreSQL Serverless - Neon / Supabase):**
   - Padrão enterprise da indústria.
   - Suporte nativo a pooling de conexões (PgBouncer) para gerenciar centenas de funções serverless sem esgotar conexões.
   - Alteração simples no schema.prisma:
     `prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     `

### 6.3 Estratégia de Armazenamento de Arquivos em Nuvem
- **Abstração de Armazenamento (StorageProvider):**
  - Implementar interface unificada de armazenamento (uploadFile, getFileUrl, deleteFile).
  - Em ambiente local (development): Salvar no diretório seguro de uploads.
  - Em ambiente de produção (production): Integrar com S3, Cloudflare R2 ou Vercel Blob (@vercel/blob).

---

## 7. Proposta de Expansão do Schema Prisma (schema.prisma)

Abaixo estão as adições e ajustes necessários no modelo relacional para cobrir todas as demandas mapeadas:

`prisma
// Adições no model User
model User {
  id             String       @id @default(cuid())
  organizationId String
  name           String
  email          String       @unique
  passwordHash   String
  role           String       @default("MEMBER") // ADMIN, SUPERVISOR, MEMBER
  avatarUrl      String?
  whatsappNumber String?      // Número para roteamento Meta Ads
  allowedDays    String?      @default("[\"MON\",\"TUE\",\"WED\",\"THU\",\"FRI\"]") // Jornada de acesso
  allowedStart   String?      @default("08:00") // Início de expediente
  allowedEnd     String?      @default("18:00") // Término de expediente
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  assignees      CardAssignee[]
  comments       CardComment[]
  createdCards   Card[]       @relation("CardCreator")
  attachments    CardAttachment[]
  goals          SalesGoal[]
}

// Adições no model Card
model Card {
  id             String   @id @default(cuid())
  pipeId         String
  currentPhaseId String
  title          String
  dealValue      Float?   @default(0)
  priority       String   @default("MEDIUM")
  color          String?  @default("#ffffff") // Seletor de cores do card
  dueDate        DateTime?
  slaStatus      String   @default("ON_TRACK")
  phaseEnteredAt DateTime @default(now())
  createdById    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  pipe         Pipe              @relation(fields: [pipeId], references: [id], onDelete: Cascade)
  currentPhase Phase             @relation(fields: [currentPhaseId], references: [id])
  creator      User?             @relation("CardCreator", fields: [createdById], references: [id], onDelete: SetNull)
  values       CardFieldValue[]
  assignees    CardAssignee[]
  labels       CardLabel[]
  checklists   CardChecklist[]
  comments     CardComment[]
  activities   CardActivity[]
  attachments  CardAttachment[]
  emailOutbox  EmailOutbox[]
}

// Novo model para Anexos
model CardAttachment {
  id           String   @id @default(cuid())
  cardId       String
  fileName     String
  fileSize     Int
  mimeType     String
  storagePath  String
  uploadedById String?
  createdAt    DateTime @default(now())

  card     Card  @relation(fields: [cardId], references: [id], onDelete: Cascade)
  uploader User? @relation(fields: [uploadedById], references: [id], onDelete: SetNull)
}

// Novo model para Gestão de Metas
model SalesGoal {
  id         String   @id @default(cuid())
  userId     String
  targetValue Float
  periodMonth Int
  periodYear  Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, periodMonth, periodYear])
}
`

---

## 8. Conclusão & Recomendações Táticas para o Orquestrador

1. **Prioridade Crítica 1 (Segurança):** Substituir imediatamente o cookie plaintext por sessão com token assinado e token binding para fechar a brecha de impersonação de Administrador.
2. **Prioridade Crítica 2 (Kanban & Context Menu):** Adicionar o componente de 3 pontinhos em CardItem.tsx com paleta de cores, movimentação direta de fases e gestão de etiquetas supervisionadas. Implementar rota DELETE /api/cards/[id].
3. **Prioridade Crítica 3 (Meta Ads Ingestion):** Construir a rota /api/webhooks/meta com suporte ao handshake hub.challenge, assinatura criptográfica HMAC-SHA256, integração com Graph API e distribuição de leads via WhatsApp dos vendedores.
4. **Prioridade Crítica 4 (Prontidão de Nuvem):** Parametrizar a suíte de testes com --test-concurrency=1 para blindagem contra travas de banco e estruturar o Prisma para chaveamento simples entre SQLite local e Turso/PostgreSQL serverless.

Este relatório fornece a fundamentação técnica completa para guiar com máxima precisão os agentes de implementação.
