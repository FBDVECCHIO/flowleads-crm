"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  TrendingUp, 
  Database, 
  FileText, 
  Sliders, 
  BarChart3, 
  Settings, 
  Workflow
} from "lucide-react";

export function Sidebar({ pipeId }: { pipeId?: string }) {
  const pathname = usePathname();
  const currentPipeId = pipeId || "cm4pipefy0001crm";

  const navItems = [
    {
      label: "Kanban de Leads",
      icon: TrendingUp,
      href: `/pipes/${currentPipeId}`,
      active: pathname.startsWith("/pipes") && !pathname.includes("/automations") && !pathname.includes("/reports"),
    },
    {
      label: "Relatórios & Funil",
      icon: BarChart3,
      href: `/pipes/${currentPipeId}/reports`,
      active: pathname.includes("/reports"),
    },
    {
      label: "Automações No-Code",
      icon: Workflow,
      href: `/pipes/${currentPipeId}/automations`,
      active: pathname.includes("/automations"),
    },
    {
      label: "Database de Clientes",
      icon: Database,
      href: `/database`,
      active: pathname.startsWith("/database"),
    },
    {
      label: "Formulário de Captura",
      icon: FileText,
      href: `/public/forms/crm-vendas`,
      external: true,
      active: false,
    },
  ];

  return (
    <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-3.5rem)] select-none">
      <div className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        Processos Comerciais
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                item.active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Sistema Operacional
        </span>
        <span className="font-mono text-[10px]">v1.0</span>
      </div>
    </aside>
  );
}