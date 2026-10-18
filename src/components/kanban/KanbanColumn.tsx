"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, MoreVertical, Edit2, Trash2, Lock, ArrowLeft, ArrowRight, GripVertical } from "lucide-react";
import { CardItem } from "./CardItem";
import { formatCurrency } from "@/lib/utils";

export interface KanbanColumnProps {
  phase: any;
  phases: any[];
  cards: any[];
  labels?: any[];
  standardChecklists?: any[];
  onOpenCard: (card: any, tab?: string) => void;
  onMoveCard: (cardId: string, targetPhaseId: string) => void;
  onColorChange?: (cardId: string, color: string) => void;
  onDeleteCard?: (cardId: string) => void;
  onApplyTag?: (cardId: string, labelId: string) => void;
  onQuickAddLead?: (phaseId: string) => void;
  onRenameCard?: (cardId: string, newTitle: string) => void;
  onRenamePhase?: (phaseId: string, currentName: string) => void;
  onDeletePhase?: (phaseId: string, phaseName: string) => void;
  onMovePhaseDirection?: (phaseId: string, direction: "left" | "right") => void;
  onReorderPhases?: (phaseIds: string[]) => void;
}

export function KanbanColumn({
  phase,
  phases,
  cards,
  labels,
  standardChecklists,
  onOpenCard,
  onMoveCard,
  onColorChange,
  onDeleteCard,
  onApplyTag,
  onQuickAddLead,
  onRenameCard,
  onRenamePhase,
  onDeletePhase,
  onMovePhaseDirection,
  onReorderPhases,
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

  // Governança estrita:
  // Coluna 1: NOVOS LEADS (imutável na 1ª posição)
  // Penúltima: FECHADO (isFinalWon, imutável)
  // Última: PERDIDO (isFinalLost, imutável)
  const isFirst = phase.order === 1 || /^(novos?\s+leads?|novo\s+lead)$/i.test(phase.name || "");
  const isWon = Boolean(phase.isFinalWon || /^(fechado\s*ganho|fechado)$/i.test(phase.name || ""));
  const isLost = Boolean(phase.isFinalLost || /^(fechado\s*perdido|perdido)$/i.test(phase.name || ""));
  const isImmutable = isFirst || isWon || isLost;

  // Identificar colunas intermediárias reordenáveis (excluindo os âncoras)
  const firstPhaseId = phases[0]?.id;
  const lostPhaseId = phases.find((p) => p.isFinalLost)?.id || phases[phases.length - 1]?.id;
  const wonPhaseId =
    phases.find((p) => (p.isFinalWon || /fechado/i.test(p.name)) && p.id !== lostPhaseId)?.id ||
    phases[phases.length - 2]?.id;

  const anchorIds = new Set([firstPhaseId, wonPhaseId, lostPhaseId].filter(Boolean));
  const intermediatePhases = phases.filter((p) => !anchorIds.has(p.id));
  const intermediateIndex = intermediatePhases.findIndex((p) => p.id === phase.id);
  const canMoveLeft = !isImmutable && intermediateIndex > 0;
  const canMoveRight = !isImmutable && intermediateIndex >= 0 && intermediateIndex < intermediatePhases.length - 1;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const phaseDragId = e.dataTransfer.getData("application/phase-id");
      if (phaseDragId && phaseDragId !== phase.id && !isImmutable && onReorderPhases) {
        const allIds = phases.map((p) => p.id);
        const fromIdx = allIds.indexOf(phaseDragId);
        const toIdx = allIds.indexOf(phase.id);
        if (fromIdx !== -1 && toIdx !== -1) {
          const reordered = [...allIds];
          const [moved] = reordered.splice(fromIdx, 1);
          reordered.splice(toIdx, 0, moved);
          onReorderPhases(reordered);
          return;
        }
      }

      const textData = e.dataTransfer.getData("text/plain");
      if (textData) {
        const data = JSON.parse(textData);
        if (data.cardId && data.sourcePhaseId !== phase.id) {
          onMoveCard(data.cardId, phase.id);
        }
      }
    } catch (err) {}
  };

  const handleColumnDragStart = (e: React.DragEvent) => {
    if (isImmutable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("application/phase-id", phase.id);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="w-72 shrink-0 bg-slate-100/90 rounded-xl flex flex-col max-h-[calc(100vh-10rem)] border border-slate-200/80 shadow-sm transition-all"
    >
      {/* Cabeçalho da Coluna com Governança e Ações de Movimentação */}
      <div
        draggable={!isImmutable}
        onDragStart={handleColumnDragStart}
        className={`p-3 border-b border-slate-200 flex items-center justify-between relative ${
          !isImmutable ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!isImmutable && (
            <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 hover:text-slate-700" title="Arraste para reposicionar a coluna" />
          )}
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: phase.color }} />
          <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase truncate" title={phase.name}>
            {phase.name}
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
            {phaseCards.length}
          </span>
          {isImmutable && (
            <Lock className="w-3 h-3 text-slate-400 shrink-0" title="Coluna padrão do sistema (posição imutável)" />
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {/* Botões de Mover Coluna para Esquerda / Direita */}
          {!isImmutable && onMovePhaseDirection && (
            <div className="flex items-center bg-slate-200/60 rounded-md p-0.5">
              <button
                type="button"
                disabled={!canMoveLeft}
                onClick={() => onMovePhaseDirection(phase.id, "left")}
                className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-white disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                title="Mover coluna para a esquerda"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                disabled={!canMoveRight}
                onClick={() => onMovePhaseDirection(phase.id, "right")}
                className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-white disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                title="Mover coluna para a direita"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {onQuickAddLead && (
            <button
              onClick={() => onQuickAddLead(phase.id)}
              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
              title={`Adicionar Lead na fase ${phase.name}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {!isImmutable && (onRenamePhase || onDeletePhase || onMovePhaseDirection) && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                title="Opções da Coluna"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-7 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 text-xs">
                  {onMovePhaseDirection && canMoveLeft && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onMovePhaseDirection(phase.id, "left");
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-blue-600" />
                      <span>Mover para Esquerda</span>
                    </button>
                  )}
                  {onMovePhaseDirection && canMoveRight && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onMovePhaseDirection(phase.id, "right");
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                      <span>Mover para Direita</span>
                    </button>
                  )}
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

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-[150px]">
        {phaseCards.length > 0 ? (
          phaseCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              phases={phases}
              labels={labels}
              standardChecklists={standardChecklists}
              onOpenCard={onOpenCard}
              onMoveCard={onMoveCard}
              onColorChange={onColorChange}
              onDeleteCard={onDeleteCard}
              onApplyTag={onApplyTag}
              onRenameCard={onRenameCard}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200/80 rounded-lg text-slate-400 text-xs">
            <span>Nenhum lead nesta fase</span>
            {onQuickAddLead && (
              <button
                onClick={() => onQuickAddLead(phase.id)}
                className="mt-2 text-blue-600 hover:underline font-semibold text-[11px]"
              >
                + Adicionar Lead
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
