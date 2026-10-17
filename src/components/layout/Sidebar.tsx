"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Target,
  TrendingUp, 
  BarChart3, 
  Workflow, 
  Users,
  ChevronLeft,
  ChevronRight,
  Layers,
  FolderTree,
  LogOut,
  Bell,
  X,
  AlertTriangle,
  Info
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SidebarProps {
  pipeId?: string;
  userName?: string;
  userRole?: string;
  orgName?: string;
  allowedMenus?: string;
}

export function Sidebar({ 
  pipeId, 
  userName = "Gestor Comercial", 
  userRole = "ADMIN",
  orgName = "Grupo Mário Neto",
  allowedMenus,
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [systemMessages, setSystemMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("flowleads_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }

    const savedWidth = localStorage.getItem("flowleads_sidebar_width");
    if (savedWidth !== null) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= 190 && parsed <= 450) {
        setSidebarWidth(parsed);
      }
    }

    // Carregar mensagens do sistema para o Sino
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const msgs = await res.json();
        setSystemMessages(Array.isArray(msgs) ? msgs : []);
        
        const readIds = JSON.parse(localStorage.getItem("flowleads_read_messages") || "[]");
        const unread = (Array.isArray(msgs) ? msgs : []).filter((m: any) => !readIds.includes(m.id)).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // Ignora falhas de rede em testes
    }
  };

  const handleOpenMessages = () => {
    setIsMessagesOpen(true);
    if (systemMessages.length > 0) {
      const allIds = systemMessages.map((m: any) => m.id);
      try {
        localStorage.setItem("flowleads_read_messages", JSON.stringify(allIds));
      } catch {}
      setUnreadCount(0);
    }
  };

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    try {
      localStorage.setItem("flowleads_sidebar_collapsed", String(nextState));
    } catch {
      // Ignore if localStorage unavailable
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    document.cookie = "flowleads_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/auth/login";
  };

  // Redimensionamento do divisor com mouse drag
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(190, Math.min(450, moveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      try {
        setSidebarWidth((current) => {
          localStorage.setItem("flowleads_sidebar_width", String(current));
          return current;
        });
      } catch {}
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const currentPipeId = pipeId || "";

  // Itens de navegação oficial do FlowLeads by Grupo Mário Neto
  const navItems = [
    {
      key: "metas",
      label: "Gestão de Metas",
      icon: Target,
      href: `/`,
      active: pathname === "/" || pathname === "/metas",
      roles: ["ADMIN", "SUPERVISOR", "MEMBER", "VIEWER"],
    },
    {
      key: "kanban",
      label: "Kanban de Leads",
      icon: TrendingUp,
      href: currentPipeId ? `/pipes/${currentPipeId}` : `/`,
      active: pathname.startsWith("/pipes") && !pathname.includes("/automations") && !pathname.includes("/reports"),
      roles: ["ADMIN", "SUPERVISOR", "MEMBER", "VIEWER"],
    },
    {
      key: "reports",
      label: "Relatórios & Funil",
      icon: BarChart3,
      href: currentPipeId ? `/pipes/${currentPipeId}/reports` : `/`,
      active: pathname.includes("/reports"),
      roles: ["ADMIN", "SUPERVISOR", "MEMBER", "VIEWER"],
    },
    {
      key: "cadastros",
      label: "Central de Cadastros",
      icon: FolderTree,
      href: `/cadastros`,
      active: pathname.startsWith("/cadastros"),
      roles: ["ADMIN", "SUPERVISOR"],
    },
    {
      key: "automations",
      label: "Automações No-Code",
      icon: Workflow,
      href: currentPipeId ? `/pipes/${currentPipeId}/automations` : `/`,
      active: pathname.includes("/automations"),
      roles: ["ADMIN", "SUPERVISOR"],
    },
    {
      key: "users",
      label: "Gestão de Usuários",
      icon: Users,
      href: `/users`,
      active: pathname.startsWith("/users"),
      roles: ["ADMIN", "SUPERVISOR"],
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles.includes(userRole)) return false;
    if (userRole === "MEMBER" && allowedMenus) {
      const allowedList = allowedMenus.split(",").map((s) => s.trim().toLowerCase());
      return allowedList.includes(item.key);
    }
    return true;
  });

  return (
    <>
      <aside 
        style={{ width: isCollapsed ? undefined : `${sidebarWidth}px` }}
        className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 select-none ${
          isResizing ? "" : "transition-all duration-300 ease-in-out"
        } border-r border-slate-800 ${
          isCollapsed ? "w-16" : "w-64"
        } min-h-screen relative z-20`}
      >
        {/* Divisor arrastável (resizable drag handle) */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            title="Arraste para redimensionar a largura do menu"
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/60 active:bg-blue-500 transition-colors z-30"
          />
        )}

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

        {/* Badge da Organização e Acesso Rápido ao Sino de Mensagens */}
        <div className="p-3 border-b border-slate-800/60 space-y-2">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-slate-800/70 border border-slate-700/50">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Organização</span>
                  <span className="text-xs font-semibold text-white truncate">{orgName}</span>
                </div>
              </div>

              {/* Botão do Sino de Mensagens no topo do menu */}
              <button
                type="button"
                onClick={handleOpenMessages}
                aria-label="Mensagens e Comunicados da Central"
                title="Mensagens e Comunicados da Central"
                className="relative p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 rounded-md transition-colors shrink-0"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex justify-center group relative">
                <div className="p-2 rounded-lg bg-slate-800/70 text-blue-400 cursor-default" title={`Organização: ${orgName}`}>
                  <Layers className="w-4 h-4" />
                </div>
                {/* Tooltip flutuante no modo colapsado */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex px-2.5 py-1 bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none">
                  Organização: {orgName}
                </div>
              </div>

              {/* Sino no modo colapsado */}
              <div className="flex justify-center group relative">
                <button
                  type="button"
                  onClick={handleOpenMessages}
                  className="p-2 rounded-lg bg-slate-800/70 text-slate-300 hover:text-blue-400 relative"
                  title="Mensagens da Central"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex px-2.5 py-1 bg-slate-800 border border-slate-700 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none">
                  Mensagens ({unreadCount} novas)
                </div>
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

        {/* Rodapé da Sidebar: Perfil do Usuário, Botão Sair & Status do Sistema */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
          {/* Perfil do Usuário com Botão de Logout integrado */}
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

              {/* Botão Sair / Logout */}
              <button
                type="button"
                onClick={handleLogout}
                title="Sair do sistema (Logout)"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-md transition-colors shrink-0 ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
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

              {/* Botão Sair no modo colapsado */}
              <div className="flex justify-center group relative">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800 transition-colors"
                  title="Sair / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex px-2 py-0.5 bg-red-950 border border-red-800 text-red-200 text-[10px] rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
                  Sair do sistema
                </div>
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

      {/* Modal do Sino de Notificações / Comunicados da Central */}
      {isMessagesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Mensagens e Comunicados da Central</h3>
                  <p className="text-[11px] text-slate-500">Informativos emitidos pelos Supervisores para a equipe</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMessagesOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {systemMessages.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  Nenhum comunicado disponível no momento.
                </div>
              ) : (
                systemMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-1.5 transition-all ${
                      msg.priority === "URGENTE"
                        ? "bg-red-50/70 border-red-200 text-red-950"
                        : "bg-blue-50/40 border-blue-100 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        {msg.priority === "URGENTE" && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        )}
                        {msg.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px]">{msg.content}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px] text-slate-400">
                      <span>Por: <strong className="text-slate-600">{msg.authorName || "Supervisor"}</strong></span>
                      <span className={`px-1.5 py-0.5 rounded font-semibold text-[9px] ${
                        msg.priority === "URGENTE" ? "bg-red-200 text-red-800" : "bg-slate-200 text-slate-700"
                      }`}>
                        {msg.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMessagesOpen(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}