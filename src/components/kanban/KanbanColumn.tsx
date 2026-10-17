"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, MoreVertical, Edit2, Trash2, Lock } from "lucide-react";
import { CardItem } from "./CardItem";
import { formatCurrency } from "@/lib/utils";

export interface KanbanColumnProps {
  phase: any;
  phases: any[];
  cards: any[];
  labels?: any[];
  onOpenCard: (card: any, tab?: string) => void;
  onMoveCard: (cardId: string, targetPhaseId: string) => void;
  onColorChange?: (cardId: string, color: string) => void;
  onDeleteCard?: (cardId: string) => void;
  onApplyTag?: (cardId: string, labelId: string) => void;
  onQuickAddLead?: (phaseId: string) => void;
  onRenameCard?: (cardId: string, newTitle: string) => void;
  onRenamePhase?: (phaseId: string, currentName: string) => void;
  onDeletePhase?: (phaseId: string, phaseName: string) => void;
}

export function KanbanColumn({
  phase,
  phases,
  cards,
  labels,
  onOpenCard,
  onMoveCard,
  onColorChange,
  onDeleteCard,
  onApplyTag,
  onQuickAddLead,
  onRenameCard,
  onRenamePhase,
  onDeletePhase,
}: KanbanColumnProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const phaseCards = cards.filter((c) => c.currentPhaseId === phase.id);
  const totalValue = phaseCards.reduce((acc, c) => acc + (c.dealValue || 0), 0);

  const isImmutable =
    phase.order === 1 ||
    phase.isFinalWon ||
    phase.isFinalLost ||
    /novo|ganho|fechado|perdido/i.test(phase.name || "");

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
      <div className="p-3 border-b border-slate-200 flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: phase.color }} />
          <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase truncate" title={phase.name}>
            {phase.name}
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {phaseCards.length}
          </span>
          {isImmutable && (
            <Lock className="w-3 h-3 text-slate-400 shrink-0" title="Coluna padrão do sistema (imutável)" />
          )}
        </div>

        <div className="flex items-center gap-1">
          {onQuickAddLead && (
            <button
              onClick={() => onQuickAddLead(phase.id)}
              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
              title={`Adicionar Lead na fase ${phase.name}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {!isImmutable && (onRenamePhase || onDeletePhase) && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                title="Opções da Coluna"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-7 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 text-xs">
                  {onRenamePhase && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onRenamePhase(phase.id, phase.name);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Renomear Coluna</span>
                    </button>
                  )}
                  {onDeletePhase && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDeletePhase(phase.id, phase.name);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Excluir Coluna</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
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
              labels={labels}
              onOpenCard={onOpenCard}
              onMoveCard={onMoveCard}
              onColorChange={onColorChange}
              onDeleteCard={onDeleteCard}
              onApplyTag={onApplyTag}
              onRenameCard={onRenameCard}
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
