"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Palette,
  ArrowRightCircle,
  Tag,
  Paperclip,
  Trash2,
  Check,
  Pencil,
} from "lucide-react";

export interface CardContextMenuProps {
  card: any;
  phases: any[];
  labels?: any[];
  onOpenCard?: () => void;
  onColorChange?: (color: string) => void;
  onMovePhase?: (targetPhaseId: string) => void;
  onApplyTag?: (labelId: string) => void;
  onOpenAttachments?: () => void;
  onDeleteCard?: () => void;
  onRenameCard?: (cardId: string, newTitle: string) => void;
}

const COLOR_PALETTE = [
  { name: "Padrão", hex: "#ffffff" },
  { name: "Azul", hex: "#3b82f6" },
  { name: "Verde", hex: "#10b981" },
  { name: "Âmbar", hex: "#f59e0b" },
  { name: "Vermelho", hex: "#ef4444" },
  { name: "Roxo", hex: "#8b5cf6" },
  { name: "Rosa", hex: "#ec4899" },
];

export function CardContextMenu({
  card,
  phases,
  labels = [],
  onOpenCard,
  onColorChange,
  onMovePhase,
  onApplyTag,
  onOpenAttachments,
  onDeleteCard,
  onRenameCard,
}: CardContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<"color" | "move" | "tag" | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamedTitle, setRenamedTitle] = useState(card.title || "");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRenamedTitle(card.title || "");
  }, [card.title]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSubmenu(null);
        setIsRenaming(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 320);
    }
    setIsOpen((prev) => !prev);
    setActiveSubmenu(null);
    setIsRenaming(false);
    setRenamedTitle(card.title || "");
  };

  const handleSaveRename = () => {
    if (renamedTitle.trim() && renamedTitle.trim() !== card.title) {
      onRenameCard?.(card.id, renamedTitle.trim());
    }
    setIsRenaming(false);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${isOpen ? "z-50" : ""}`} ref={menuRef}>
      {/* 3-dots trigger button */}
      <button
        type="button"
        onClick={toggleMenu}
        aria-label="Menu de ações do card (três pontinhos)"
        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-0 ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          } w-56 bg-white rounded-lg shadow-2xl border border-slate-200 z-[100] py-1 text-xs text-slate-700 animate-in fade-in duration-100`}
        >
          {/* Action 0: Abrir e Editar Lead Completo */}
          {onOpenCard && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenCard();
              }}
              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-blue-50 text-blue-600 transition-colors text-left font-semibold border-b border-slate-100"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Editar dados do lead</span>
            </button>
          )}

          {/* Action 1: Renomear Card Rápido */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsRenaming(!isRenaming);
                setActiveSubmenu(null);
              }}
              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors text-left font-medium"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Renomear título</span>
            </button>

            {isRenaming && (
              <div className="p-2.5 border-t border-slate-100 bg-slate-50 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-600 block">Novo nome do lead:</span>
                <input
                  type="text"
                  autoFocus
                  value={renamedTitle}
                  onChange={(e) => setRenamedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename();
                    if (e.key === "Escape") setIsRenaming(false);
                  }}
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRenaming(false)}
                    className="px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-200 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRename}
                    className="px-2.5 py-0.5 text-[10px] bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action 1: Alterar Cor do Card */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveSubmenu(activeSubmenu === "color" ? null : "color")}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-blue-500" />
                <span>Alterar cor</span>
              </span>
              <span className="text-[10px] text-slate-400">&rsaquo;</span>
            </button>

            {activeSubmenu === "color" && (
              <div className="p-2 border-t border-slate-100 grid grid-cols-7 gap-1.5 bg-slate-50">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => {
                      onColorChange?.(c.hex);
                      setIsOpen(false);
                    }}
                    className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.hex }}
                  >
                    {card.color === c.hex && (
                      <Check className={`w-3 h-3 ${c.hex === "#ffffff" ? "text-slate-700" : "text-white"}`} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action 2: Mover para fase */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveSubmenu(activeSubmenu === "move" ? null : "move")}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <ArrowRightCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mover fase...</span>
              </span>
              <span className="text-[10px] text-slate-400">&rsaquo;</span>
            </button>

            {activeSubmenu === "move" && (
              <div className="max-h-40 overflow-y-auto py-1 border-t border-slate-100 bg-slate-50">
                {phases.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={p.id === card.currentPhaseId}
                    onClick={() => {
                      onMovePhase?.(p.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-[11px] flex items-center justify-between hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                      p.id === card.currentPhaseId ? "font-bold text-blue-600 bg-blue-50/50" : "text-slate-600"
                    }`}
                  >
                    <span>{p.name}</span>
                    {p.id === card.currentPhaseId && <span className="text-[10px] text-blue-500">(Atual)</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action 3: Aplicar Etiqueta / Tag */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveSubmenu(activeSubmenu === "tag" ? null : "tag")}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>Aplicar etiqueta (tag)</span>
              </span>
              <span className="text-[10px] text-slate-400">&rsaquo;</span>
            </button>

            {activeSubmenu === "tag" && (
              <div className="max-h-36 overflow-y-auto p-2 border-t border-slate-100 bg-slate-50 space-y-1">
                {labels.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">Nenhuma etiqueta cadastrada pelo Supervisor.</p>
                ) : (
                  labels.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        onApplyTag?.(l.id);
                        setIsOpen(false);
                      }}
                      className="w-full px-2 py-1 rounded text-white text-[10px] font-medium flex items-center justify-between hover:opacity-90"
                      style={{ backgroundColor: l.color }}
                    >
                      <span>{l.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action 4: Anexos e Documentos */}
          <button
            type="button"
            onClick={() => {
              onOpenAttachments?.();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors text-left"
          >
            <Paperclip className="w-3.5 h-3.5 text-purple-500" />
            <span>Anexos & Receitas</span>
          </button>

          {/* Action 5: Excluir card */}
          {onDeleteCard && (
            <div className="pt-1 mt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onDeleteCard();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir card</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
