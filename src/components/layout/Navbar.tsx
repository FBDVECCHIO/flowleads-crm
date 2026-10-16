"use client";

import Link from "next/link";
import { Search, Plus, Bell, ExternalLink } from "lucide-react";

export function Navbar({ 
  pipeId, 
}: { 
  pipeId?: string; 
  userName?: string; 
}) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      {/* Busca Global de Leads / Processos */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar leads, empresas ou tarefas..."
            className="w-full pl-9 pr-14 py-1.5 text-xs bg-slate-100 hover:bg-slate-200/70 focus:bg-white border border-transparent focus:border-blue-500 rounded-lg transition-colors outline-none text-slate-800 placeholder-slate-400"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200/80 text-slate-500 px-1.5 py-0.5 rounded font-mono font-medium pointer-events-none">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Ações Rápidas de Topo */}
      <div className="flex items-center gap-3">
        <Link
          href="/public/forms/crm-vendas"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200/80"
        >
          <span>Formulário de Leads</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Notificações de Leads Entrantes */}
        <button
          type="button"
          aria-label="Notificações"
          title="Notificações operacionais"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
        </button>

        {/* Gatilho Rápido de Ação: Novo Lead */}
        <Link
          href={pipeId ? `/pipes/${pipeId}` : "/"}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Lead</span>
        </Link>
      </div>
    </header>
  );
}