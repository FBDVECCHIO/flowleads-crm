"use client";

import { formatCurrency } from "@/lib/utils";
import { Flame } from "lucide-react";

interface GoalThermometerProps {
  currentAmount: number;
  targetAmount: number;
  percentage: number;
  currentDeals: number;
  targetDeals: number;
  dealsPercentage: number;
  userName?: string;
}

export function GoalThermometer({
  currentAmount,
  targetAmount,
  percentage,
  currentDeals,
  targetDeals,
  dealsPercentage,
  userName,
}: GoalThermometerProps) {
  // Determine gradient color and status message based on attainment percentage
  let barGradient = "from-red-500 to-rose-600";
  let statusBadge = {
    label: "Abaixo da Meta",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  };

  if (percentage >= 120) {
    barGradient = "from-purple-600 via-indigo-600 to-emerald-500";
    statusBadge = {
      label: "Supermeta Batida! 👑",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    };
  } else if (percentage >= 100) {
    barGradient = "from-emerald-500 to-teal-600";
    statusBadge = {
      label: "Meta Batida! 🚀",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  } else if (percentage >= 80) {
    barGradient = "from-blue-600 to-cyan-600";
    statusBadge = {
      label: "Na Reta Final",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    };
  } else if (percentage >= 50) {
    barGradient = "from-amber-500 to-yellow-500";
    statusBadge = {
      label: "Em Evolução",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  const visualProgressWidth = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header do Termômetro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Flame className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">
                Termômetro de Metas {userName ? `• ${userName}` : ""}
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.badgeClass}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhamento em tempo real de atingimento financeiro e negócios ganhos
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <span className="text-3xl font-extrabold text-slate-900">
            {percentage.toFixed(1)}%
          </span>
          <span className="text-xs font-medium text-slate-500">da meta realizada</span>
        </div>
      </div>

      {/* Barra de Progresso com Marcadores */}
      <div className="space-y-2">
        <div className="relative w-full h-7 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700 ease-out shadow flex items-center justify-end pr-2`}
            style={{ width: `${visualProgressWidth}%` }}
          >
            {visualProgressWidth > 15 && (
              <span className="text-[11px] font-bold text-white drop-shadow">
                {percentage.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Marcadores de 25%, 50%, 75%, 100% */}
        <div className="relative flex justify-between text-[11px] font-semibold text-slate-400 px-1 pt-1">
          <span>0%</span>
          <span className="text-center">25%</span>
          <span className="text-center">50%</span>
          <span className="text-center">75%</span>
          <span className="text-emerald-600 font-bold">100% (Meta)</span>
        </div>
      </div>

      {/* Métricas Comparativas: Financeiro vs Negócios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Faturamento Realizado</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {formatCurrency(currentAmount)}
            </div>
            <span className="text-[11px] text-slate-500">
              de {formatCurrency(targetAmount)} estipulados
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-blue-600">
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Contratos Ganhos (Deals)</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {currentDeals} fechamento{currentDeals !== 1 ? "s" : ""}
            </div>
            <span className="text-[11px] text-slate-500">
              de {targetDeals} negócios previstos
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-blue-600">
              {dealsPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
