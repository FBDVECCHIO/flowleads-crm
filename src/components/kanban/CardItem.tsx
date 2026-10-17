"use client";

import { CheckSquare, MessageSquare, AlertCircle, User, Megaphone, Globe } from "lucide-react";
import { formatCurrency, maskPhone } from "@/lib/utils";
import { CardContextMenu } from "./CardContextMenu";

export interface CardItemProps {
  card: any;
  phases: any[];
  labels?: any[];
  standardChecklists?: any[];
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
  standardChecklists,
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
  let cardItems: any[] = [];
  if (card.checklists && card.checklists.length > 0) {
    try {
      cardItems = JSON.parse(card.checklists[0].items || "[]");
    } catch (e) {}
  }

  if (standardChecklists && standardChecklists.length > 0) {
    checklistProgress.total = standardChecklists.length;
    checklistProgress.done = standardChecklists.filter((sc) => {
      const match = cardItems.find((ci) => ci.id === sc.id || ci.text === sc.title);
      return Boolean(match?.completed);
    }).length;
  } else if (cardItems.length > 0) {
    checklistProgress.total = cardItems.length;
    checklistProgress.done = cardItems.filter((i: any) => i.completed).length;
  }

  const slaWarning = card.slaStatus === "WARNING";
  const slaOverdue = card.slaStatus === "OVERDUE";

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ cardId: card.id, sourcePhaseId: card.currentPhaseId }));
  };

  const hasCustomColor = card.color && card.color !== "#ffffff";

  // Extrair dados do lead com suporte resiliente a aliases
  const getValue = (...identifiers: string[]) => {
    for (const ident of identifiers) {
      const normalizedIdent = ident.toLowerCase();
      const valObj = card.values?.find((v: any) => {
        const fieldKey = (v.field?.identifier || "").toLowerCase();
        return fieldKey === normalizedIdent || fieldKey.includes(normalizedIdent);
      });
      if (valObj?.value && String(valObj.value).trim()) {
        return String(valObj.value).trim();
      }
    }
    return "";
  };

  const clientName = (getValue("lead_name", "name", "nome", "cliente") || card.title || "LEAD SEM NOME").toUpperCase();
  const rawPhone = getValue("lead_phone", "whatsapp", "phone", "telefone", "celular");
  const clientPhone = rawPhone ? maskPhone(rawPhone) : "NÃO INFORMADO";
  const cleanPhoneDigits = rawPhone.replace(/\D/g, "");
  const whatsappUrl = cleanPhoneDigits
    ? `https://wa.me/55${cleanPhoneDigits.startsWith("55") ? cleanPhoneDigits.slice(2) : cleanPhoneDigits}`
    : null;

  // Origem do Lead
  const rawOrigin = getValue("lead_origin", "origin", "origem");
  const origin = (rawOrigin || (card.creator ? "MANUAL" : "META ADS")).toUpperCase();

  // Campanha atrelada via META ou manual
  const rawCampaign = getValue("campaign_interest", "campaign", "campanha");
  const campaign = (rawCampaign || "META ADS").toUpperCase();

  // Usuário responsável (assignee, creator, ou vendedor identificado por telefone/loja)
  const responsibleUser =
    (card.assignees && card.assignees.length > 0 && card.assignees[0].user?.name)
      ? card.assignees[0].user.name
      : card.creator?.name
      ? card.creator.name
      : getValue("seller_name", "seller", "vendedor", "responsavel", "consultor")
      ? getValue("seller_name", "seller", "vendedor", "responsavel", "consultor")
      : "Sem resp.";

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpenCard(card)}
      style={hasCustomColor ? { borderLeftColor: card.color, borderLeftWidth: "4px" } : undefined}
      className="bg-white rounded-lg p-2.5 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group select-none space-y-1.5 relative text-xs"
    >
      {/* 1. TOPO DO CARD: Nome do lead (principal) ao lado dos 3 pontinhos */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors uppercase truncate tracking-tight"
            title={clientName}
          >
            {clientName}
          </span>
          {(slaWarning || slaOverdue) && (
            <span
              title={slaOverdue ? "SLA Vencido" : "SLA em Alerta (>70%)"}
              className={`w-2 h-2 rounded-full shrink-0 ${slaOverdue ? "bg-red-500 animate-pulse" : "bg-amber-500"}`}
            />
          )}
        </div>

        {/* 3 pontinhos na parte superior ao lado do nome */}
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

      {/* 2. DEPOIS DO NOME: WhatsApp formatado com link direto para chamar */}
      <div className="flex items-center justify-between text-[11px] bg-slate-50 rounded px-2 py-1 border border-slate-100">
        <div className="flex items-center gap-1 text-slate-700 font-mono text-[11px] truncate">
          <MessageSquare className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate">{clientPhone}</span>
        </div>
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200 transition-colors shrink-0 ml-1"
            title="Abrir WhatsApp Web"
          >
            Chamar
          </a>
        )}
      </div>

      {/* 3. ABAIXO DO WHATSAPP: Origem do lead */}
      <div className="flex items-center gap-1 text-[10px] text-slate-600 truncate">
        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
        <span className="text-slate-400 font-medium">Origem:</span>
        <span className="font-semibold text-slate-700 uppercase truncate" title={origin}>
          {origin}
        </span>
      </div>

      {/* 4. ABAIXO DA ORIGEM: Campanha atrelada via META ou manual */}
      <div className="flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50/80 px-1.5 py-0.5 rounded border border-purple-100 font-medium truncate">
        <Megaphone className="w-3 h-3 text-purple-600 shrink-0" />
        <span className="text-slate-500 text-[9px] font-normal">Campanha:</span>
        <span className="font-semibold truncate uppercase" title={campaign}>
          {campaign}
        </span>
      </div>

      {/* 5. ABAIXO DA ORIGEM/CAMPANHA: Usuário responsável */}
      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-600 truncate">
        <div className="flex items-center gap-1 truncate">
          <User className="w-3 h-3 text-blue-600 shrink-0" />
          <span className="text-slate-400 font-medium">Resp:</span>
          <span className="font-semibold text-slate-700 uppercase truncate" title={responsibleUser}>
            {responsibleUser}
          </span>
        </div>

        {card.dealValue > 0 && (
          <span className="font-bold text-emerald-700 text-[10px] shrink-0 font-mono">
            {formatCurrency(card.dealValue)}
          </span>
        )}
      </div>

      {/* 6. BASE DO CARD: Tags na base e ao lado o contador em cinza baixo do Checklist */}
      <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 flex-wrap">
        {/* As tags devem ficar na base do card */}
        <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
          {card.labels && card.labels.length > 0 ? (
            card.labels.map((cl: any) => (
              <span
                key={cl.id}
                className="text-[9px] font-semibold px-1.5 py-0.2 rounded text-white truncate max-w-[85px]"
                style={{ backgroundColor: cl.label.color }}
                title={cl.label.name}
              >
                {cl.label.name}
              </span>
            ))
          ) : (
            <span className="text-[9px] text-slate-300">Sem tags</span>
          )}
        </div>

        {/* Ao lado das tags o contador em cinza baixo do Checklist */}
        <div
          className="flex items-center gap-1 text-slate-400 text-[10px] font-medium shrink-0"
          title={`Checklist: ${checklistProgress.done} de ${checklistProgress.total} concluídos`}
        >
          <CheckSquare className="w-3 h-3 text-slate-400" />
          <span>
            {checklistProgress.done}/{checklistProgress.total}
          </span>
        </div>
      </div>
    </div>
  );
}
