"use client";

import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BarChart3, TrendingUp, DollarSign, Award, Target, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: pipeId } = use(params);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports?pipeId=${pipeId}`)
      .then((res) => res.json())
      .then((data) => setReportData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [pipeId]);

  if (loading) {
    return (
      <AppShell pipeId={pipeId} userName="Gestor Comercial">
        <div className="text-center p-12 text-xs text-slate-400">Carregando métricas e relatórios do funil...</div>
      </AppShell>
    );
  }

  const summary = reportData?.summary || {};
  const funnel = reportData?.funnel || [];
  const maxCount = Math.max(...funnel.map((f: any) => f.count), 1);

  return (
    <AppShell pipeId={pipeId} userName="Gestor Comercial">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Relatórios & Funil de Conversão</h1>
          </div>
          <p className="text-xs text-slate-500">
            Painel analítico e indicadores de desempenho do pipeline de vendas (Pipefy Reports & Analytics).
          </p>
        </div>

        {/* Grid de KPIs Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total de Leads</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{summary.totalCards || 0}</span>
              <span className="text-xs text-blue-600 font-medium">{summary.activeCards || 0} em andamento</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Taxa de Conversão</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">{summary.conversionRate || 0}%</span>
              <span className="text-xs text-slate-400">Won/Total</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Pipeline Total</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900">{formatCurrency(summary.totalPipelineValue)}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Ganho (Won)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-emerald-700">{formatCurrency(summary.wonValue)}</span>
            </div>
          </div>
        </div>

        {/* Gráfico Visual do Funil de Vendas */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Desempenho por Fase do Funil</h3>
            <span className="text-xs text-slate-500 font-medium">Volume de Leads & Valor em R$</span>
          </div>

          <div className="space-y-3 pt-2">
            {funnel.map((step: any, idx: number) => {
              const widthPct = Math.max(8, Math.round((step.count / maxCount) * 100));
              return (
                <div key={step.phaseId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[10px]">#{idx + 1}</span>
                      <span className="font-semibold text-slate-800">{step.phaseName}</span>
                      {step.isFinalWon && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">Ganho</span>}
                      {step.isFinalLost && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">Perdido</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-bold text-slate-700">{step.count} leads</span>
                      <span className="font-semibold text-emerald-700 w-24 text-right">
                        {formatCurrency(step.value)}
                      </span>
                    </div>
                  </div>

                  {/* Barra do Funil */}
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-inner"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: step.color || "#3b82f6",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
