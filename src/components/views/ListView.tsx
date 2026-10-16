"use client";

import { formatCurrency, formatDate } from "@/lib/utils";

export function ListView({
  phases,
  cards,
  onOpenCard,
}: {
  phases: any[];
  cards: any[];
  onOpenCard: (card: any) => void;
}) {
  return (
    <div className="space-y-6">
      {phases.map((phase) => {
        const phaseCards = cards.filter((c) => c.currentPhaseId === phase.id);
        if (phaseCards.length === 0) return null;

        return (
          <div key={phase.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div
              className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between"
              style={{ borderLeftWidth: 4, borderLeftColor: phase.color }}
            >
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>{phase.name}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {phaseCards.length}
                </span>
              </h3>
              <span className="text-xs font-semibold text-slate-600">
                {formatCurrency(phaseCards.reduce((acc, c) => acc + (c.dealValue || 0), 0))}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {phaseCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => onOpenCard(card)}
                  className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer text-xs"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-900">{card.title}</h4>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Criado em: {formatDate(card.createdAt)}</span>
                      {card.priority && <span>Prioridade: {card.priority}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-emerald-700">{formatCurrency(card.dealValue)}</span>
                    <button className="text-blue-600 font-medium hover:underline text-xs">Abrir &rarr;</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
