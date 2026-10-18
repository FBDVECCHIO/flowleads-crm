"use client";

import { GoalProgress } from "@/services/goalService";
import { formatCurrency } from "@/lib/utils";
import { Trophy, Medal, MessageSquare, ExternalLink, ArrowUpRight } from "lucide-react";

interface GoalRankingTableProps {
  ranking?: GoalProgress[];
  currentUserId?: string;
}

export function GoalRankingTable({ ranking = [], currentUserId }: GoalRankingTableProps) {
  const list = Array.isArray(ranking) ? ranking : [];
  return (
    <div className="liquid-glass-card bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Ranking Geral da Equipe Comercial
            </h3>
            <p className="text-xs text-slate-500">
              Classificação por percentual de atingimento de meta de vendas
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          Tabela atualizada em tempo real • Ciclo Vigente
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
              <th className="py-3.5 px-4 w-16 text-center whitespace-nowrap">Posição</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Vendedor / Consultor</th>
              <th className="py-3.5 px-4 whitespace-nowrap">WhatsApp Comercial</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Meta</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Meta/Dia</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Realizado (R$)</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Deals</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Atingimento</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Ritmo</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((rep) => {
              const isCurrentUser = rep.userId === currentUserId;
              const cleanPhone = rep.whatsappNumber ? rep.whatsappNumber.replace(/\D/g, "") : "";

              return (
                <tr
                  key={rep.userId}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isCurrentUser ? "bg-blue-50/60 font-semibold" : ""
                  }`}
                >
                  {/* Posição / RankingPosition */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center">
                      {rep.rankingPosition === 1 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center text-xs shadow-sm border border-amber-300">
                          🥇 1º
                        </span>
                      ) : rep.rankingPosition === 2 ? (
                        <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-300">
                          🥈 2º
                        </span>
                      ) : rep.rankingPosition === 3 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-700/10 text-amber-800 font-bold flex items-center justify-center text-xs border border-amber-700/30">
                          🥉 3º
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold">
                          {rep.rankingPosition}º
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Nome e Avatar */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                        {rep.userName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">
                          {rep.userName}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-normal">
                              Você
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {rep.role === "ADMIN" || rep.role === "SUPERVISOR" ? "Supervisor" : "Consultor de Vendas"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* WhatsApp Comercial */}
                  <td className="py-4 px-4">
                    {rep.whatsappNumber ? (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-xs border border-emerald-200 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{rep.whatsappNumber}</span>
                        <ExternalLink className="w-3 h-3 text-emerald-500 opacity-60" />
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Não vinculado</span>
                    )}
                  </td>

                  {/* Meta (R$) */}
                  <td className="py-4 px-4 text-right font-medium text-slate-600 whitespace-nowrap">
                    {formatCurrency(rep.targetAmount)}
                  </td>

                  {/* Meta/Dia (R$) */}
                  <td className="py-4 px-4 text-right font-semibold text-blue-600 whitespace-nowrap">
                    {formatCurrency(rep.dailyTargetNormal || (rep.targetAmount / (rep.workingDaysPerMonth || 22)))}
                  </td>

                  {/* Realizado (R$) */}
                  <td className="py-4 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(rep.currentAmount)}
                  </td>

                  {/* Deals Ganhos */}
                  <td className="py-4 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {rep.currentDeals} / {rep.targetDeals}
                    </span>
                  </td>

                  {/* Atingimento (%) */}
                  <td className="py-4 px-4 text-right">
                    <span
                      className={`font-extrabold text-sm ${
                        rep.percentage >= 100
                          ? "text-emerald-600"
                          : rep.percentage >= 80
                          ? "text-blue-600"
                          : rep.percentage >= 50
                          ? "text-amber-600"
                          : "text-red-500"
                      }`}
                    >
                      {rep.percentage.toFixed(1)}%
                    </span>
                  </td>

                  {/* Ritmo (Pacing) */}
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`font-bold text-xs px-2 py-0.5 rounded-full border ${
                        rep.pacingStatus === "ACIMA"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : rep.pacingStatus === "NO_RITMO"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {(rep.pacingPercentage || 100).toFixed(0)}%
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4 text-center">
                    {rep.percentage >= 100 ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Batida 🚀
                      </span>
                    ) : rep.percentage >= 80 ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Próximo
                      </span>
                    ) : rep.percentage >= 50 ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Em Ritmo
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Atenção
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
