"use client";

import { Plus } from "lucide-react";
import { CardItem } from "./CardItem";
import { formatCurrency } from "@/lib/utils";

export interface KanbanColumnProps {
  phase: any;
  phases: any[];
  cards: any[];
  onOpenCard: (card: any) => void;
  onMoveCard: (cardId: string, targetPhaseId: string) => void;
  onQuickAddLead?: (phaseId: string) => void;
}

export function KanbanColumn({
  phase,
  phases,
  cards,
  onOpenCard,
  onMoveCard,
  onQuickAddLead,
}: KanbanColumnProps) {
  const phaseCards = cards.filter((c) => c.currentPhaseId === phase.id);
  const totalValue = phaseCards.reduce((acc, c) => acc + (c.dealValue || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.cardId && data.sourcePhaseId !== phase.id) {
        onMoveCard(data.cardId, phase.id);
      }
    } catch (err) {}
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="w-80 shrink-0 bg-slate-100/90 rounded-xl flex flex-col max-h-[calc(100vh-10rem)] border border-slate-200/80 shadow-sm"
    >
      <div className="p-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: phase.color }} />
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">{phase.name}</h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {phaseCards.length}
          </span>
        </div>

        {phase.order === 1 && onQuickAddLead && (
          <button
            onClick={() => onQuickAddLead(phase.id)}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
            title="Adicionar Lead Manualmente"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="px-3 py-1.5 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between border-b border-slate-100 font-medium">
        <span>Total da Fase:</span>
        <span className="font-semibold text-slate-700">{formatCurrency(totalValue)}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[150px]">
        {phaseCards.length > 0 ? (
          phaseCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              phases={phases}
              onOpenCard={onOpenCard}
              onMoveCard={onMoveCard}
            />
          ))
        ) : (
          <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[11px] text-slate-400">
            Nenhum lead nesta fase
          </div>
        )}
      </div>
    </div>
  );
}
