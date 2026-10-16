"use client";

import Link from "next/link";
import { Search, Plus, Bell, HelpCircle, Layers, ExternalLink } from "lucide-react";

export function Navbar({ userName = "Gestor Comercial", orgName = "Acme Corp Brasil" }: { userName?: string; orgName?: string }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/30">
            F
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 tracking-tight leading-none text-base">
              FlowLeads
            </span>
            <span className="text-[10px] text-blue-600 font-medium leading-none mt-0.5">
              Pipefy CRM Parity
            </span>
          </div>
        </Link>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/60 text-xs font-medium text-slate-700">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>{orgName}</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar leads, empresas ou tarefas..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-200/70 focus:bg-white border border-transparent focus:border-blue-500 rounded-md transition-colors outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/public/forms/crm-vendas"
          target="_blank"
          className="hidden lg:flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors border border-blue-200"
        >
          <span>Formulário Público de Leads</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 pl-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-slate-700 hidden sm:inline">{userName}</span>
        </div>
      </div>
    </header>
  );
}