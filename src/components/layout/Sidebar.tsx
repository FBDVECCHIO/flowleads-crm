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
    try {
      localStorage.setItem("flowleads_sidebar_collapsed", String(nextState));
    } catch {
      // Ignore if localStorage unavailable
    }
  };

  const currentPipeId = pipeId || "";

  // Menu simplificado conforme R1 e R2 (Database de Clientes oculto)
  const navItems = [
    {
      label: "Gestão de Metas",
      icon: Target,
      href: `/`,
      active: pathname === "/" || pathname === "/metas",
      roles: ["ADMIN", "SUPERVISOR", "MEMBER", "VIEWER"],
    },
    {
      label: "Kanban de Leads",
      icon: TrendingUp,
      href: currentPipeId ? `/pipes/${currentPipeId}` : `/`,
      active: pathname.startsWith("/pipes") && !pathname.includes("/automations") && !pathname.includes("/reports"),
      roles: ["ADMIN", "SUPERVISOR", "MEMBER", "VIEWER"],
    },
    {
      label: "Relatórios & Funil",
      icon: BarChart3,
      href: currentPipeId ? `/pipes/${currentPipeId}/reports` : `/`,
      active: pathname.includes("/reports"),
      roles: ["ADMIN", "SUPERVISOR", "MEMBER", "VIEWER"],
    },
    {
      label: "Automações No-Code",
      icon: Workflow,
      href: currentPipeId ? `/pipes/${currentPipeId}/automations` : `/`,
      active: pathname.includes("/automations"),
      roles: ["ADMIN", "SUPERVISOR"],
    },
    {
      label: "Formulário de Captura",
      icon: FileText,
      href: `/public/forms/crm-vendas`,
      external: true,
      active: false,
      roles: ["ADMIN", "SUPERVISOR", "MEMBER"],
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
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800 relative">
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
            <Link href="/" className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/30">
              F
            </Link>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            isCollapsed 
              ? "absolute -right-3 top-5 bg-slate-800 border border-slate-700 shadow-md rounded-full text-slate-300 hover:text-white z-30" 
              : ""
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
            <div className="p-2 rounded-lg bg-slate-800/70 text-blue-400 cursor-default" title={`Organização: ${orgName}`}>
              <Layers className="w-4 h-4" />
            </div>
            {/* Tooltip flutuante no modo colapsado */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex px-2.5 py-1 bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none">
              Organização: {orgName}
            </div>
          </div>
        )}
      </div>

      {/* Navegação Principal */}
      <div className="flex-1 py-3 px-2 space-y-1">
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
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex px-2.5 py-1 bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none">
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
                <span className="text-[10px] text-blue-400 capitalize">
                  {userRole === "ADMIN" || userRole === "SUPERVISOR" ? "Supervisor" : "Vendedor"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center group relative">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col px-2.5 py-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none">
              <span className="font-semibold">{userName}</span>
              <span className="text-[10px] text-blue-400">
                {userRole === "ADMIN" || userRole === "SUPERVISOR" ? "Supervisor" : "Vendedor"}
              </span>
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
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex px-2 py-0.5 bg-slate-800 border border-slate-700 text-emerald-400 text-[10px] rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
              Sistema Online
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}