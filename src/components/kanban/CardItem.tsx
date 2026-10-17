"use client";

import { Clock, CheckSquare, MessageSquare, AlertCircle, DollarSign, User, MoreVertical, MoreHorizontal } from "lucide-react";
import { formatCurrency, formatDate, maskPhone } from "@/lib/utils";
import { CardContextMenu } from "./CardContextMenu";

export interface CardItemProps {
  card: any;
  phases: any[];
  labels?: any[];
  onOpenCard: (card: any, tab?: string) => void;
  onMoveCard: (cardId: string, targetPhaseId: string) => void;
  onColorChange?: (cardId: string, color: string) => void;
  onDeleteCard?: (cardId: string) => void;
  onApplyTag?: (cardId: string, labelId: string) => void;
  onRenameCard?: (cardId: string, newTitle: string) => void;
}

export function CardItem({
  card,
  phases,
  labels,
  onOpenCard,
  onMoveCard,
  onColorChange,
  onDeleteCard,
  onApplyTag,
  onRenameCard,
}: CardItemProps) {
  const currentPhaseIndex = phases.findIndex((p) => p.id === card.currentPhaseId);
  const nextPhase = phases[currentPhaseIndex + 1];

  let checklistProgress = { total: 0, done: 0 };
  if (card.checklists && card.checklists.length > 0) {
    try {
      const items = JSON.parse(card.checklists[0].items || "[]");
      checklistProgress.total = items.length;
      checklistProgress.done = items.filter((i: any) => i.completed).length;
    } catch (e) {}
  }

  const slaWarning = card.slaStatus === "WARNING";
  const slaOverdue = card.slaStatus === "OVERDUE";

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ cardId: card.id, sourcePhaseId: card.currentPhaseId }));
  };

  const hasCustomColor = card.color && card.color !== "#ffffff";

  // Extrair dados explícitos do lead
  const getValue = (identifier: string) => {
    const valObj = card.values?.find((v: any) => v.field?.identifier === identifier);
    return valObj?.value ? String(valObj.value).trim() : "";
  };

  const clientName = (getValue("lead_name") || card.title || "LEAD SEM NOME").toUpperCase();
  const rawPhone = getValue("lead_phone") || "";
  const clientPhone = rawPhone ? maskPhone(rawPhone) : "NÃO INFORMADO";
  const cleanPhoneDigits = rawPhone.replace(/\D/g, "");
  const whatsappUrl = cleanPhoneDigits ? `https://wa.me/55${cleanPhoneDigits.startsWith("55") ? cleanPhoneDigits.slice(2) : cleanPhoneDigits}` : null;
  const campaign = (getValue("campaign_interest") || getValue("lead_origin") || "META ADS").toUpperCase();

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpenCard(card)}
      style={hasCustomColor ? { borderLeftColor: card.color, borderLeftWidth: "4px" } : undefined}
      className="bg-white rounded-lg p-3.5 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group select-none space-y-2.5 relative"
    >
      <div className="flex items-center justify-between gap-1">
        {(slaWarning || slaOverdue) ? (
          <div
            className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
              slaOverdue ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>{slaOverdue ? "SLA Vencido" : "SLA em Alerta (>70%)"}</span>
          </div>
        ) : <div />}

        {/* 3-dots Context Menu (pontinhos) */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <CardContextMenu
            card={card}
            phases={phases}
            labels={labels}
            onColorChange={(color) => onColorChange?.(card.id, color)}
            onMovePhase={(targetPhaseId) => onMoveCard(card.id, targetPhaseId)}
            onApplyTag={(labelId) => onApplyTag?.(card.id, labelId)}
            onOpenAttachments={() => onOpenCard(card, "attachments")}
            onDeleteCard={onDeleteCard ? () => onDeleteCard(card.id) : undefined}
            onRenameCard={onRenameCard}
          />
        </div>
      </div>

      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labels.map((cl: any) => (
            <span
              key={cl.id}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: cl.label.color }}
            >
              {cl.label.name}
            </span>
          ))}
        </div>
      )}

      {/* 1. Nome do Cliente (Proeminente) */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-xs truncate tracking-tight uppercase" title={clientName}>
            {clientName}
          </span>
        </div>
      </div>

      {/* 2. WhatsApp Formatado com Botão de Ação Direta */}
      <div className="flex items-center justify-between text-[11px] bg-slate-50 rounded px-2.5 py-1.5 border border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <MessageSquare className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="font-mono text-[11px]">{clientPhone}</span>
        </div>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200 transition-colors"
            title="Abrir conversa no WhatsApp Web"
          >
            Chamar
          </a>
        )}
      </div>

      {/* 3. Campanha de Origem (Meta Ads / Manual) */}
      <div className="flex items-center gap-1.5 text-[10px] text-purple-700 bg-purple-50/90 px-2 py-1 rounded border border-purple-100 font-semibold truncate">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
        <span className="truncate uppercase" title={`Campanha: ${campaign}`}>
          {campaign}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
        <span className="font-semibold text-emerald-700 flex items-center gap-0.5">
          {formatCurrency(card.dealValue)}
        </span>
        {card.priority && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              card.priority === "URGENT"
                ? "bg-red-100 text-red-800"
                : card.priority === "HIGH"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {card.priority}
          </span>
        )}
      </div>


      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <div className="flex items-center gap-2.5">
          {checklistProgress.total > 0 && (
            <span className="flex items-center gap-1" title="Checklist">
              <CheckSquare className="w-3 h-3" />
              <span>
                {checklistProgress.done}/{checklistProgress.total}
              </span>
            </span>
          )}
          {card._count?.comments > 0 && (
            <span className="flex items-center gap-1" title="Comentários">
              <MessageSquare className="w-3 h-3" />
              <span>{card._count.comments}</span>
            </span>
          )}
        </div>

        <div className="flex items-center -space-x-1.5">
          {card.assignees && card.assignees.length > 0 ? (
            card.assignees.map((ca: any) => (
              <div
                key={ca.id}
                title={ca.user.name}
                className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-white"
              >
                {ca.user.name.slice(0, 1)}
              </div>
            ))
          ) : (
            <span className="text-[10px] text-slate-400">Sem resp.</span>
          )}
        </div>
      </div>

      {nextPhase && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveCard(card.id, nextPhase.id);
          }}
          className="w-full mt-1 py-1 text-[10px] font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded border border-slate-200 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
        >
          <span>Avançar para {nextPhase.name}</span>
          <span>&rarr;</span>
        </button>
      )}
    </div>
  );
}
