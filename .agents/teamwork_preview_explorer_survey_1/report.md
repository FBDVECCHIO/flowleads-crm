# Relatório Técnico de Investigação: Frontend, Layout & Rebranding Survey
**Agente:** `teamwork_preview_explorer_survey_1`  
**Data:** 16 de Outubro de 2026  
**Ambiente:** FlowLeads CRM (`C:\Users\fbdv1\.gemini\antigravity\scratch\flowleads-crm`)

---

## 1. Mapeamento Completo de Rebranding: "Pipefy", "Acme Corp" e Nomes Legados

A investigação identificou todas as ocorrências de nomes legados, marcas terceiras e referências de protótipo no código, metadados, banco de dados e documentação.

### 1.1 Ocorrências em Código de Produção & UI (`src/`)

| Arquivo | Linhas | Código Atual | Alteração Proposta (FlowLeads by Grupo Mário Neto) |
|---|---|---|---|
| `src/components/layout/Navbar.tsx` | 6 | `export function Navbar({ userName = "Gestor Comercial", orgName = "Acme Corp Brasil" }: ...)` | Alterar default para `orgName = "Grupo Mário Neto"` |
| `src/components/layout/Navbar.tsx` | 18-20 | `<span className="text-[10px] text-blue-600 font-medium leading-none mt-0.5">Pipefy CRM Parity</span>` | Substituir por `<span className="text-[10px] text-blue-600 font-medium leading-none mt-0.5">by Grupo Mário Neto</span>` |
| `src/components/layout/Sidebar.tsx` | 17 | `const currentPipeId = pipeId \|\| "cm4pipefy0001crm";` | Remover o ID legado com menção `pipefy`, substituindo por busca dinâmica ou rota fallback limpa `/` / `/metas` |
| `src/app/layout.tsx` | 6 | `description: "Plataforma completa de gestão de leads, funil comercial e automações no-code inspirada no Pipefy."` | Alterar para: `"Plataforma comercial e gestão de leads FlowLeads by Grupo Mário Neto."` |
| `src/app/page.tsx` | 22 | `<AppShell pipeId={defaultPipe?.id} userName="Gestor Comercial" orgName="Acme Corp Brasil">` | Substituir `orgName="Acme Corp Brasil"` por `orgName="Grupo Mário Neto"` |
| `src/app/page.tsx` | 28-30 | `<span>Pipefy Architecture & Complete CRM Engine</span>` | Substituir por `<span>FlowLeads by Grupo Mário Neto</span>` |
| `src/app/auth/login/page.tsx` | 53 | `<p className="text-xs text-slate-500">Paridade Funcional e Experiência Pipefy</p>` | Substituir por `<p className="text-xs text-slate-500">by Grupo Mário Neto</p>` |
| `src/app/database/page.tsx` | 73 | `Bancos de dados relacionais estruturados no estilo Pipefy Tables para suporte aos processos.` | Substituir por `Bancos de dados relacionais estruturados para suporte aos processos comerciais.` |
| `src/app/pipes/[id]/reports/page.tsx` | 42 | `Painel analítico e indicadores de desempenho do pipeline de vendas (Pipefy Reports & Analytics).` | Substituir por `Painel analítico e indicadores de desempenho do funil de vendas FlowLeads.` |
| `src/app/pipes/[id]/automations/page.tsx` | 72 | `Configure regras automáticas de processo no estilo Pipefy (Gatilho &rarr; Ação).` | Substituir por `Configure regras automáticas de processo e roteamento (Gatilho &rarr; Ação).` |
| `src/app/globals.css` | 16 | `/* Custom scrollbars Pipefy style */` | Atualizar comentário para `/* Custom scrollbars FlowLeads style */` |
| `src/services/cardService.ts` | 164 | `// Validação de campos obrigatórios da fase de destino (Pipefy Rule)` | Atualizar comentário para `// Validação de campos obrigatórios da fase de destino` |

### 1.2 Ocorrências em Configurações & Infraestrutura

| Arquivo | Linhas | Código Atual | Alteração Proposta |
|---|---|---|---|
| `tailwind.config.cjs` | 11-18 | `pipefy: { 50: '#eff6ff', 100: '#dbeafe', 500: '#0b66c3', 600: '#0050c8', 700: '#003c96', 900: '#0a192f' }` | Renomear a chave de paleta para `flowleads:` ou `brand:`, garantindo coerência semântica. |

### 1.3 Ocorrências no Banco de Dados (`prisma/seed.ts`)

| Arquivo | Linhas | Código Atual | Alteração Proposta |
|---|---|---|---|
| `prisma/seed.ts` | 33-34 | `name: "Acme Corp Brasil", slug: "acme"` | Atualizar para `name: "Grupo Mário Neto", slug: "grupo-mario-neto"` |
| `prisma/seed.ts` | 77 | `description: "Pipeline comercial inspirado no Pipefy com qualificação BANT, controle de SLA e automações."` | Atualizar para `description: "Pipeline comercial FlowLeads com qualificação BANT, controle de SLA e automações."` |
| `prisma/seed.ts` | 373 | `Precisam substituir planilhas por um CRM estruturado estilo Pipefy para 25 corretores.` | Atualizar para `Precisam substituir planilhas por um CRM estruturado FlowLeads para 25 corretores.` |

### 1.4 Ocorrências em Testes e Documentação

| Arquivo | Linhas | Código Atual |
|---|---|---|
| `tests/full-flow.test.ts` | 9 | `test("Task 14: Full End-to-End Flow Test (Pipefy CRM Workflow)", ...)` |
| `docs/walkthrough.md` | 4, 11, 17, 50, 54, 78 | Menções conceituais a Pipefy e paridade arquitetural |
| `docs/superpowers/specs/2026-10-16-pipefy-crm-design.md` | 1, 4, 17 | Título e referências no spec de design |
| `docs/superpowers/plans/2026-10-16-pipefy-crm-implementation.md` | 1, 5, 17, 83 | Título e tarefas do plano de implementação |
| `docs/research/rea-pipefy-analysis.md` | 1, 4, 11, 17, 21 | Documento de pesquisa reversa |
| `docs/research/pipefy-feature-catalog.md` | 1 | Catálogo de features |
| `docs/research/pipefy-data-model-api.md` | 1 | Modelo de dados reverso |

---

## 2. Diagnóstico da Estrutura de Layout & UI Shell

### 2.1 Arquitetura Atual
A hierarquia atual é estruturada da seguinte forma:
```
RootLayout (src/app/layout.tsx)
  └── Página Específica (ex: src/app/page.tsx, src/app/pipes/[id]/page.tsx)
        └── AppShell (src/components/layout/AppShell.tsx)
              ├── Navbar (src/components/layout/Navbar.tsx) -> Cabeçalho Horizontal Fixo Topo (h-14)
              └── Container Flex (flex flex-1)
                    ├── Sidebar (src/components/layout/Sidebar.tsx) -> Menu Lateral Esquerdo Fixo (w-56)
                    └── main (flex-1 overflow-x-hidden p-6) -> Conteúdo da Rota
```

### 2.2 Problemas Identificados no Layout Atual
1. **Acoplamento por Página**: O `AppShell` é invocado individualmente dentro de cada `page.tsx` (`app/page.tsx`, `database/page.tsx`, `pipes/[id]/page.tsx`, etc.), passando propriedades manuais como `pipeId={pipeId} userName="Gestor Comercial"`.
2. **Distribuição Inadequada de Elementos no Topo**: O `Navbar.tsx` (cabeçalho superior) concentra:
   - Identidade da Marca (Logo + Nome + Paridade)
   - Badge da Organização (`Acme Corp Brasil`)
   - Barra de Busca Global
   - Link externo para Formulário Público
   - Avatar e Nome do Usuário (`userName`)
3. **Sidebar Rígida e Estática**:
   - Largura fixa em `w-56` (`224px`), sem opção de colapso para ganho de área útil no Kanban.
   - Não contém o Perfil do Usuário, Organização ou Status de Conexão.
   - O item `Database de Clientes` está exposto no menu principal.

---

## 3. Especificação Técnica: Sidebar Dinâmica Colapsável

Para atender aos critérios de aceitação:
- **Modo Expandido:** Largura `w-64` (`256px`), exibindo logotipo FlowLeads, subtítulo "by Grupo Mário Neto", badge da organização, links de navegação com ícones + rótulos, e rodapé com perfil do usuário e status operacional.
- **Modo Colapsado (Ícones Exclusivos):** Largura `w-16` (`64px`), ocultando todos os textos e rótulos. Exibe ícones perfeitamente centralizados com tooltips explicativos ao passar o mouse.
- **Persistência de Estado:** Gravação em `localStorage` sob a chave `"flowleads_sidebar_collapsed"`.
- **Transição Suave:** Animação via classes utilitárias Tailwind: `transition-all duration-300 ease-in-out`.

### 3.1 Proposta de Implementação para o Componente `Sidebar.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Target,
  TrendingUp, 
  BarChart3, 
  Workflow, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Layers,
  LogOut,
  ShieldCheck
} from "lucide-react";

interface SidebarProps {
  pipeId?: string;
  userName?: string;
  userRole?: string;
  orgName?: string;
}

export function Sidebar({ 
  pipeId, 
  userName = "Gestor Comercial", 
  userRole = "ADMIN",
  orgName = "Grupo Mário Neto" 
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("flowleads_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("flowleads_sidebar_collapsed", String(nextState));
  };

  const currentPipeId = pipeId || "";

  // Menu simplificado conforme R1 e R2 (Database de Clientes oculto)
  const navItems = [
    {
      label: "Gestão de Metas",
      icon: Target,
      href: `/`,
      active: pathname === "/" || pathname === "/metas",
      roles: ["ADMIN", "MEMBER", "VIEWER"],
    },
    {
      label: "Kanban de Leads",
      icon: TrendingUp,
      href: currentPipeId ? `/pipes/${currentPipeId}` : `/`,
      active: pathname.startsWith("/pipes") && !pathname.includes("/automations") && !pathname.includes("/reports"),
      roles: ["ADMIN", "MEMBER", "VIEWER"],
    },
    {
      label: "Relatórios & Funil",
      icon: BarChart3,
      href: currentPipeId ? `/pipes/${currentPipeId}/reports` : `/`,
      active: pathname.includes("/reports"),
      roles: ["ADMIN", "MEMBER", "VIEWER"],
    },
    {
      label: "Automações No-Code",
      icon: Workflow,
      href: currentPipeId ? `/pipes/${currentPipeId}/automations` : `/`,
      active: pathname.includes("/automations"),
      roles: ["ADMIN"], // Restrito ao Supervisor/Admin conforme R2
    },
    {
      label: "Formulário de Captura",
      icon: FileText,
      href: `/public/forms/crm-vendas`,
      external: true,
      active: false,
      roles: ["ADMIN", "MEMBER"],
    },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside 
      className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 select-none transition-all duration-300 ease-in-out border-r border-slate-800 ${
        isCollapsed ? "w-16" : "w-64"
      } min-h-screen relative z-20`}
    >
      {/* Cabeçalho da Sidebar: Logo & Toggle */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800">
        {!isCollapsed ? (
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md shadow-blue-500/30">
              F
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-white tracking-tight leading-none text-base">
                FlowLeads
              </span>
              <span className="text-[10px] text-blue-400 font-medium leading-none mt-1 truncate">
                by Grupo Mário Neto
              </span>
            </div>
          </Link>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/30">
              F
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            isCollapsed ? "absolute -right-3 top-5 bg-slate-800 border border-slate-700 shadow-md rounded-full" : ""
          }`}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Badge da Organização (Migrado do Cabeçalho Superior) */}
      <div className="p-3 border-b border-slate-800/60">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-800/70 border border-slate-700/50">
            <Layers className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Organização</span>
              <span className="text-xs font-semibold text-white truncate">{orgName}</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center group relative">
            <div className="p-2 rounded-lg bg-slate-800/70 text-blue-400" title={`Organização: ${orgName}`}>
              <Layers className="w-4 h-4" />
            </div>
            {/* Tooltip flutuante no modo colapsado */}
            <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex px-2 py-1 bg-slate-800 border border-slate-700 text-white text-[11px] font-medium rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none">
              {orgName}
            </div>
          </div>
        )}
      </div>

      {/* Navegação Principal */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Navegação Comercial
          </div>
        )}

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="relative group">
              <Link
                href={item.href}
                target={item.external ? "_blank" : undefined}
                className={`flex items-center rounded-lg text-xs font-medium transition-all ${
                  isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                } ${
                  item.active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>

              {/* Tooltip flutuante do item de menu */}
              {isCollapsed && (
                <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex px-2.5 py-1 bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodapé da Sidebar: Perfil do Usuário & Status do Sistema */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
        {/* Perfil do Usuário (Migrado do Cabeçalho Superior) */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate">{userName}</span>
                <span className="text-[10px] text-blue-400 capitalize">{userRole === "ADMIN" ? "Supervisor" : "Vendedor"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center group relative">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col px-2.5 py-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none">
              <span className="font-semibold">{userName}</span>
              <span className="text-[10px] text-blue-400">{userRole === "ADMIN" ? "Supervisor" : "Vendedor"}</span>
            </div>
          </div>
        )}

        {/* Status Operacional */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistema Operacional Online
            </span>
            <span className="font-mono text-[9px] text-slate-400">v1.0</span>
          </div>
        ) : (
          <div className="flex justify-center group relative pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex px-2 py-0.5 bg-slate-800 border border-slate-700 text-emerald-400 text-[10px] rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
              Sistema Online
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
```

---

## 4. Reestruturação do Cabeçalho Superior (`Navbar.tsx`)

Com a migração do Perfil, Organização e Status para a Sidebar, o cabeçalho superior é despoluído, atuando estritamente como **Action Bar Global**:

### 4.1 Novo Papel do `Navbar.tsx`
- **Busca Rápida de Leads / Cards:** Campo de busca central com atalho `Ctrl+K`.
- **Ações Rápidas de Topo:**
  - Botão de criação rápida de Lead (`+ Novo Lead`).
  - Link de visualização do Formulário Público.
  - Indicador de notificações de leads entrantes via Meta Ads / Webhook.

---

## 5. Ocultação do Menu "Database de Clientes" & Fluxo Comercial Simplificado

### 5.1 Ocultação do Menu
- O menu `Database de Clientes` (`/database`) foi removido do array de navegação da `Sidebar.tsx`.
- A rota `/database` permanece no servidor para eventuais consultas de retaguarda, mas não polui a esteira operacional dos vendedores.

### 5.2 Rota Padrão Pós-Login: Gestão de Metas
Conforme exigido pelo Requisito R2:
- A tela inicial (`/` ou `/metas`) passa a ser o painel **Gestão de Metas**:
  - Saudação personalizada no topo: `"Bem-vindo - [Nome do Usuário]"`
  - Termômetro visual de meta (ex: Meta Mensal R$ 100.000,00 | Realizado R$ 68.500,00 - 68.5%)
  - Ranking comercial e desempenho por fase do funil
  - Botão direto para `"Acessar Quadro Kanban"`

---

## 6. Mapeamento da Stack Tecnológica, Scripts e Estado do Build

### 6.1 Dependências e Versões
- **Next.js:** `^15.2.1` (App Router ativo, TypeScript strict)
- **React:** `^19.0.0`
- **React DOM:** `^19.0.0`
- **TypeScript:** `^5.7.3`
- **Tailwind CSS:** `^3.4.17` + PostCSS `^8.5.3` + Autoprefixer `^10.4.20`
- **Utilitários UI:** `clsx` (`^2.1.1`), `tailwind-merge` (`^3.0.2`)
- **Ícones:** `lucide-react` (`^0.475.0`)
- **Banco de Dados / ORM:** Prisma `^6.4.1` com `@prisma/client` `^6.4.1`, SQLite local em `prisma/dev.db`
- **Criptografia / Auth:** `bcryptjs` `^3.0.2`
- **Test Runner:** Node.js native test runner (`node --experimental-strip-types`)

### 6.2 Verificação de Build & Testes
1. **Testes Unitários e de Integração:**
   - Comando: `npm test` (`node --experimental-strip-types --test tests/*.test.ts`)
   - Resultado: **7 testes executados, 7 aprovados (100% pass)** quando executados com a base seedada (`npm run db:seed`).
2. **Build de Produção:**
   - Comando: `npx next build`
   - Resultado: **Sucesso absoluto** (`Compiled successfully in 10.7s`, 13 páginas estáticas e rotas de API geradas sem falhas de tipagem ou lint).

---

## 7. Recomendações para a Próxima Etapa de Implementação

1. **Rebranding Imediato de Strings e Metadados:**
   - Atualizar `src/components/layout/Navbar.tsx`, `src/components/layout/Sidebar.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/auth/login/page.tsx`, `tailwind.config.cjs` e `prisma/seed.ts`.
2. **Implementar a Nova Sidebar Colapsável & AppShell Simplificado:**
   - Substituir `Sidebar.tsx` e `Navbar.tsx` conforme o design proposto, garantindo a persistência via `localStorage`.
3. **Criação do Painel de Metas como Tela Inicial Padrão:**
   - Atualizar `src/app/page.tsx` para renderizar a Gestão de Metas com saudação `"Bem-vindo - [Nome]"` e barra de progresso.
4. **Governança de Menu por Perfil (RBAC):**
   - Vendedores visualizam unicamente Gestão de Metas, Kanban e Relatórios.
   - Supervisores têm acesso às configurações de equipe e automações.
