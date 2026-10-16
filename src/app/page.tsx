import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PipeService } from "@/services/pipeService";
import { 
  TrendingUp, 
  ExternalLink, 
  ArrowRight, 
  Plus, 
  Clock, 
  Workflow, 
  Database,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function HomePage() {
  const pipes = await PipeService.listPipes();
  const defaultPipe = pipes[0];

  return (
    <AppShell pipeId={defaultPipe?.id} userName="Gestor Comercial" orgName="Acme Corp Brasil">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner de Boas-vindas */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Pipefy Architecture & Complete CRM Engine</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Gestão de Leads & Funil Comercial
            </h1>
            <p className="text-blue-100 text-sm mt-1 leading-relaxed">
              Sistema completo com controle de SLAs, qualificação BANT por fase, motor de automações no-code, captura pública de leads e banco de dados relacional.
            </p>

            <div className="flex flex-wrap gap-3 mt-4">
              {defaultPipe && (
                <Link
                  href={`/pipes/${defaultPipe.id}`}
                  className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <span>Abrir Quadro Kanban</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link
                href="/public/forms/crm-vendas"
                target="_blank"
                className="px-4 py-2 bg-blue-800/60 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg border border-blue-400/30 transition-colors flex items-center gap-1.5"
              >
                <span>Acessar Formulário Público de Leads</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Lista de Pipes / Processos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Seus Pipes de Processo</h2>
              <p className="text-xs text-slate-500">Fluxos de trabalho ativos na organização</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipes.map((pipe) => (
              <Link
                key={pipe.id}
                href={`/pipes/${pipe.id}`}
                className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: pipe.color }}
                    >
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {pipe._count.cards} leads
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                    {pipe.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {pipe.description || "Pipeline comercial com fases estruturadas."}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{pipe.phases.length} fases configuradas</span>
                  <span className="font-medium text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Ver Kanban &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}