"use client";

import Link from "next/link";
import { GoalProgress } from "@/services/goalService";
import { GoalThermometer } from "./GoalThermometer";
import { GoalRankingTable } from "./GoalRankingTable";
import { formatCurrency } from "@/lib/utils";
import { 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Trophy, 
  Target, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Zap,
  TrendingDown,
  AlertCircle 
} from "lucide-react";

interface GoalDashboardProps {
  userGoal: GoalProgress;
  teamRanking?: GoalProgress[] | null;
  isSupervisor?: boolean;
  defaultPipeId?: string;
  orgName?: string;
}

export function GoalDashboard({
  userGoal,
  teamRanking,
  isSupervisor = false,
  defaultPipeId,
  orgName = "Grupo Mário Neto",
}: GoalDashboardProps) {
  const targetAmount = userGoal?.targetAmount ?? 100000;
  const currentAmount = userGoal?.currentAmount ?? 0;
  const percentage = userGoal?.percentage ?? (targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0);
  const targetDeals = userGoal?.targetDeals ?? 10;
  const currentDeals = userGoal?.currentDeals ?? 0;
  const dealsPercentage = userGoal?.dealsPercentage ?? (targetDeals > 0 ? Math.round((currentDeals / targetDeals) * 100) : 0);
  const userName = userGoal?.userName || "Consultor Comercial";
  const rankingPosition = userGoal?.rankingPosition ?? 1;
  const missingAmount = Math.max(0, targetAmount - currentAmount);

  const workingDays = userGoal?.workingDaysPerMonth || 22;
  const currentWorkingDay = userGoal?.currentWorkingDay || 1;
  const remainingWorkingDays = userGoal?.remainingWorkingDays || 21;
  const dailyTargetNormal = userGoal?.dailyTargetNormal || (targetAmount / workingDays);
  const dailyTargetAccumulated = userGoal?.dailyTargetAccumulated || (remainingWorkingDays > 0 ? missingAmount / remainingWorkingDays : 0);
  const weeklyTarget = userGoal?.weeklyTarget || (dailyTargetNormal * 5);
  const pacingPercentage = userGoal?.pacingPercentage || 100;
  const pacingStatus = userGoal?.pacingStatus || "NO_RITMO";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Banner de Boas-vindas Personalizado */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>FlowLeads by {orgName}</span>
            <span className="text-blue-200">•</span>
            <span className="text-blue-100">Expediente Comercial Ativo</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bem-vindo - {userName}
          </h1>

          <p className="text-blue-100 text-sm leading-relaxed max-w-2xl">
            Acompanhe suas metas de receita, contratos fechados no ciclo comercial vigente, ritmo diário por dias úteis e seu posicionamento na equipe.
          </p>

          {/* Ações Rápidas */}
          <div className="flex flex-wrap gap-3 pt-2">
            {defaultPipeId && (
              <Link
                href={`/pipes/${defaultPipeId}`}
                className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Abrir Kanban de Leads</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {defaultPipeId && (
              <Link
                href={`/pipes/${defaultPipeId}/reports`}
                className="px-4 py-2.5 bg-blue-800/60 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl border border-blue-400/30 transition-all flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4 text-blue-200" />
                <span>Relatórios & Funil</span>
              </Link>
            )}

            {isSupervisor && (
              <Link
                href="/users"
                className="px-4 py-2.5 bg-blue-900/40 hover:bg-blue-900/70 text-white text-xs font-semibold rounded-xl border border-blue-400/20 transition-all flex items-center gap-2"
              >
                <Users className="w-3.5 h-3.5 text-blue-300" />
                <span>Gestão de Usuários</span>
              </Link>
            )}
          </div>
        </div>

        {/* Decoração visual de fundo */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
      </div>

      {/* 2. Grid Principal de KPIs de Metas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Meta Mensal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Meta Mensal Total</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(targetAmount)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {targetDeals} contratos estipulados
            </p>
          </div>
        </div>

        {/* Card 2: Realizado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Realizado (Ganho)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-600">
              {formatCurrency(currentAmount)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {percentage.toFixed(1)}% atingido ({currentDeals} deals)
            </p>
          </div>
        </div>

        {/* Card 3: Faltante */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Faltante p/ Cota</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">
              {missingAmount > 0 ? formatCurrency(missingAmount) : "Meta Batida! 🎯"}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {missingAmount > 0 ? `Para fechar em ${remainingWorkingDays} dias úteis` : "Superando a meta mensal"}
            </p>
          </div>
        </div>

        {/* Card 4: Posição no Ranking */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Sua Posição</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-purple-600">
              {rankingPosition}º Lugar
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              No ranking geral de vendas
            </p>
          </div>
        </div>
      </div>

      {/* 2.1 Grid Analítico: Metas por Dias Úteis & Ritmo (Pacing) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card A: Meta Diária Normal */}
        <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Meta Diária Normal</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-extrabold text-slate-900">
              {formatCurrency(dailyTargetNormal)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Meta ÷ {workingDays} dias úteis
            </p>
          </div>
        </div>

        {/* Card B: Meta Diária Acumulada (Restante) */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 p-5 rounded-2xl border border-blue-200/70 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">Meta Diária Acumulada</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-extrabold text-blue-700">
              {formatCurrency(dailyTargetAccumulated)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Faltante ÷ {remainingWorkingDays} dias restantes
            </p>
          </div>
        </div>

        {/* Card C: Meta Semanal */}
        <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Meta Semanal</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl font-extrabold text-slate-900">
              {formatCurrency(weeklyTarget)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Meta Diária × 5 dias úteis
            </p>
          </div>
        </div>

        {/* Card D: Ritmo de Vendas (Pacing) */}
        <div className="bg-gradient-to-br from-white to-emerald-50/30 p-5 rounded-2xl border border-emerald-200/70 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">Ritmo de Vendas (Pacing)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-extrabold text-emerald-700">
                {pacingPercentage.toFixed(1)}%
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentWorkingDay}º dia útil de {workingDays}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                pacingStatus === "ACIMA"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : pacingStatus === "NO_RITMO"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {pacingStatus === "ACIMA" ? "Adiantado" : pacingStatus === "NO_RITMO" ? "No Ritmo" : "Atenção"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Termômetro Visual de Metas */}
      <GoalThermometer
        currentAmount={currentAmount}
        targetAmount={targetAmount}
        percentage={percentage}
        currentDeals={currentDeals}
        targetDeals={targetDeals}
        dealsPercentage={dealsPercentage}
        userName={userName}
        dailyTargetNormal={dailyTargetNormal}
        dailyTargetAccumulated={dailyTargetAccumulated}
        weeklyTarget={weeklyTarget}
        pacingPercentage={pacingPercentage}
        workingDaysPerMonth={workingDays}
        currentWorkingDay={currentWorkingDay}
        remainingWorkingDays={remainingWorkingDays}
        pacingStatus={pacingStatus}
      />

      {/* 4. Tabela de Ranking da Equipe */}
      {teamRanking && teamRanking.length > 0 && (
        <GoalRankingTable
          ranking={teamRanking}
          currentUserId={userGoal?.userId}
        />
      )}
    </div>
  );
}
