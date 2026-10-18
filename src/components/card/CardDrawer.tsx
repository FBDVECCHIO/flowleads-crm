"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X, 
  CheckSquare, 
  History, 
  AlertCircle,
  Send,
  Paperclip,
  FileText,
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  Check,
  Building2,
  Sparkles,
  Lock
} from "lucide-react";
import { formatDate, maskPhone } from "@/lib/utils";

export interface CardDrawerProps {
  card: any;
  phases: any[];
  fields: any[];
  onClose: () => void;
  onUpdateFields: (cardId: string, fieldValues: Record<string, string>) => Promise<void>;
  onMovePhase: (cardId: string, targetPhaseId: string, fieldValues?: Record<string, string>) => Promise<void>;
  onAddComment: (cardId: string, content: string) => Promise<void>;
  onToggleChecklist: (cardId: string, checklistId: string, itemId: string, completed: boolean) => Promise<void>;
  onDeleteCard?: (cardId: string) => void;
  onRenameCard?: (cardId: string, newTitle: string) => Promise<void> | void;
  defaultTab?: "fields" | "checklist" | "activity" | "attachments";
}

export function CardDrawer({
  card,
  phases,
  fields,
  onClose,
  onUpdateFields,
  onMovePhase,
  onAddComment,
  onToggleChecklist,
  onDeleteCard,
  onRenameCard,
  defaultTab = "fields",
}: CardDrawerProps) {
  const [activeTab, setActiveTab] = useState<"fields" | "checklist" | "activity" | "attachments">(defaultTab || "fields");
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (card?.values) {
      for (const v of card.values) {
        map[v.field.identifier] = v.value;
      }
    }
    return map;
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(card?.title || "");
  const [stores, setStores] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [standardChecklists, setStandardChecklists] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentTitle(card?.title || "");
    // Carregar Lojas, Campanhas, Vendedores e Checklist Padrão
    const loadCrosscheckData = async () => {
      try {
        const t = Date.now();
        const [sRes, cRes, selRes, chkRes] = await Promise.all([
          fetch(`/api/stores?_t=${t}`, { cache: "no-store" }),
          fetch(`/api/campaigns?_t=${t}`, { cache: "no-store" }),
          fetch(`/api/sellers?_t=${t}`, { cache: "no-store" }),
          fetch(`/api/checklists?_t=${t}`, { cache: "no-store" }),
        ]);
        if (sRes.ok) setStores(await sRes.json());
        if (cRes.ok) setCampaigns(await cRes.json());
        if (selRes.ok) setSellers(await selRes.json());
        if (chkRes.ok) setStandardChecklists(await chkRes.json());
      } catch (err) {
        // Fallback gracioso
      }
    };
    loadCrosscheckData();
  }, [card]);

  const handleSaveTitle = async () => {
    if (!currentTitle.trim()) return;
    const cleanTitle = currentTitle.trim().toUpperCase();
    try {
      if (onRenameCard) {
        await onRenameCard(card.id, cleanTitle);
      } else {
        await fetch(`/api/cards/${card.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: cleanTitle }),
        });
      }
      card.title = cleanTitle;
      setCurrentTitle(cleanTitle);
      setFormValues((prev) => ({ ...prev, lead_name: cleanTitle }));
      setIsEditingTitle(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao renomear card.");
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileUrl = reader.result as string;
          const res = await fetch(`/api/cards/${card.id}/attachments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileUrl,
              mimeType: file.type || "application/octet-stream",
              sizeBytes: file.size,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Erro ao anexar arquivo.");
          }

          const newAttachment = await res.json();
          if (card.attachments) {
            card.attachments.unshift(newAttachment);
          } else {
            card.attachments = [newAttachment];
          }
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg(err.message);
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Deseja realmente excluir este anexo permanentemente?")) return;
    try {
      const res = await fetch(`/api/cards/${card.id}/attachments?attachmentId=${attachmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao excluir anexo.");
      }
      if (card.attachments) {
        card.attachments = card.attachments.filter((a: any) => a.id !== attachmentId);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  if (!card) return null;

  const currentPhase = phases.find((p) => p.id === card.currentPhaseId);
  const visibleFields = fields.filter((f) => !f.phaseId || f.phaseId === card.currentPhaseId);

  const handleFieldChange = (identifier: string, value: string) => {
    let cleanVal = value;
    if (identifier.includes("phone")) {
      cleanVal = maskPhone(cleanVal);
    } else if (!identifier.includes("email") && !identifier.includes("url") && !identifier.includes("link")) {
      cleanVal = cleanVal.toUpperCase();
    }
    setFormValues((prev) => ({ ...prev, [identifier]: cleanVal }));
  };

  const handleSaveFields = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);
    try {
      if (formValues.lead_name && formValues.lead_name.trim()) {
        const cleanName = formValues.lead_name.trim().toUpperCase();
        card.title = cleanName;
        setCurrentTitle(cleanName);
      }
      await onUpdateFields(card.id, formValues);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (targetPhaseId: string) => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await onMovePhase(card.id, targetPhaseId, formValues);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await onAddComment(card.id, newComment.trim().toUpperCase());
      setNewComment("");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: currentPhase?.color || "#3b82f6" }}
              >
                {currentPhase?.name}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {card.id.slice(-6)}</span>
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  autoFocus
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  className="px-2 py-1 text-sm font-bold text-slate-900 border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 w-full"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 shrink-0"
                  title="Salvar nome"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 shrink-0"
                  title="Cancelar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="text-base font-bold text-slate-900 leading-tight">{card.title}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTitle(card.title);
                    setIsEditingTitle(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-opacity"
                  title="Renomear Lead"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onDeleteCard && (
              <button
                type="button"
                onClick={() => {
                  onDeleteCard(card.id);
                }}
                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                title="Excluir lead"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-xs">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 shrink-0">Mover para:</span>
          {phases.map((phase) => {
            const isCurrent = phase.id === card.currentPhaseId;
            return (
              <button
                key={phase.id}
                onClick={() => !isCurrent && handleMove(phase.id)}
                disabled={isCurrent || saving}
                className={`px-2.5 py-1 rounded text-[11px] font-medium shrink-0 transition-colors flex items-center gap-1 ${
                  isCurrent
                    ? "bg-blue-600 text-white font-bold shadow-sm"
                    : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
              >
                <span>{phase.name}</span>
                {phase.isFinalWon && <span>🏆</span>}
                {phase.isFinalLost && <span>❌</span>}
              </button>
            );
          })}
        </div>

        {errorMsg && (
          <div className="m-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex border-b border-slate-200 px-4">
          <button
            onClick={() => setActiveTab("fields")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "fields" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Campos do Lead
          </button>
          <button
            onClick={() => setActiveTab("checklist")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "checklist" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Checklist
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "activity" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Histórico & Atividades
          </button>
          <button
            onClick={() => setActiveTab("attachments")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "attachments" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Anexos & Receitas ({card.attachments?.length || 0})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "fields" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800">Formulário de Informações do Lead</span>
                  <p className="text-[10px] text-slate-400">Preencha os dados de distribuição para a loja física</p>
                </div>
                <button
                  onClick={handleSaveFields}
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>

              {/* Grid Compacto de Campos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(() => {
                  const closingFieldKeys = new Set(["os_number", "sale_amount", "sale_date"]);
                  const isWonPhase = Boolean(currentPhase?.isFinalWon || /ganho|fechado\s*ganho/i.test(currentPhase?.name || ""));

                  return visibleFields.map((field) => {
                    const isTextArea = field.type === "TEXTAREA";
                    const isSelect = field.type === "SELECT";
                    const isCampaign = field.identifier === "campaign_interest";
                    const isStore = field.identifier === "store_negotiated";
                    const isSeller = field.identifier === "seller_name";
                    const isClosingField = closingFieldKeys.has(field.identifier);
                    const isLocked = isClosingField && !isWonPhase;

                    return (
                      <div 
                        key={field.id} 
                        className={`space-y-1 ${isTextArea ? "sm:col-span-2" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <label className="block text-[11px] font-semibold text-slate-700">
                            {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                          </label>
                          {isLocked && (
                            <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold border border-amber-200 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Fase Fechado
                            </span>
                          )}
                        </div>

                        {isTextArea ? (
                          <textarea
                            rows={2}
                            disabled={isLocked}
                            value={formValues[field.identifier] || ""}
                            onChange={(e) => handleFieldChange(field.identifier, e.target.value)}
                            placeholder={isLocked ? "Disponível apenas na fase Fechado Ganho" : field.placeholder || ""}
                            className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isLocked
                                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                : "border-slate-300"
                            }`}
                          />
                        ) : isCampaign ? (
                          <select
                            disabled={isLocked}
                            value={formValues[field.identifier] || ""}
                            onChange={(e) => handleFieldChange(field.identifier, e.target.value)}
                            className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isLocked
                                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            <option value="">Selecione uma campanha...</option>
                            {campaigns.length > 0
                              ? campaigns.map((c) => (
                                  <option key={c.id} value={c.name}>
                                    {c.name}
                                  </option>
                                ))
                              : JSON.parse(field.options || "[]").map((opt: string) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                          </select>
                        ) : isStore ? (
                          <select
                            disabled={isLocked}
                            value={formValues[field.identifier] || ""}
                            onChange={(e) => handleFieldChange(field.identifier, e.target.value)}
                            className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isLocked
                                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            <option value="">Selecione a loja de destino...</option>
                            {stores.length > 0
                              ? stores.map((s) => (
                                  <option key={s.id} value={s.name}>
                                    {s.name}
                                  </option>
                                ))
                              : JSON.parse(field.options || "[]").map((opt: string) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                          </select>
                        ) : isSeller ? (
                          (() => {
                            const matchedStore = stores.find((s) => s.name === formValues["store_negotiated"]);
                            const filteredSellers = matchedStore
                              ? sellers.filter((s) => s.storeId === matchedStore.id)
                              : sellers;
                            return (
                              <select
                                disabled={isLocked}
                                value={formValues[field.identifier] || ""}
                                onChange={(e) => handleFieldChange(field.identifier, e.target.value)}
                                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  isLocked
                                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                <option value="">
                                  {isLocked ? "Disponível apenas na fase Fechado Ganho" : "Selecione o vendedor / atendente..."}
                                </option>
                                {filteredSellers.length > 0
                                  ? filteredSellers.map((sel) => (
                                      <option key={sel.id} value={sel.name}>
                                        {sel.name} ({sel.role})
                                      </option>
                                    ))
                                  : JSON.parse(field.options || "[]").map((opt: string) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                              </select>
                            );
                          })()
                        ) : isSelect ? (
                          <select
                            disabled={isLocked}
                            value={formValues[field.identifier] || ""}
                            onChange={(e) => handleFieldChange(field.identifier, e.target.value)}
                            className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isLocked
                                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            <option value="">Selecione...</option>
                            {JSON.parse(field.options || "[]").map((opt: string) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={
                              field.type === "NUMBER" || field.type === "CURRENCY"
                                ? "number"
                                : field.type === "DATE"
                                ? "date"
                                : "text"
                            }
                            disabled={isLocked}
                            value={formValues[field.identifier] || ""}
                            onChange={(e) => handleFieldChange(field.identifier, e.target.value)}
                            placeholder={isLocked ? "Disponível apenas na fase Fechado Ganho" : field.placeholder || ""}
                            className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isLocked
                                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                : "border-slate-300"
                            }`}
                          />
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Botão de salvar alterações nos campos do lead */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl mt-4">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  {saveSuccess ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      Alterações salvas com sucesso!
                    </span>
                  ) : (
                    <span>Clique para salvar todas as alterações realizadas no lead.</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveFields}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? "Salvando..." : "Salvar Dados do Lead"}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800">Checklist Padrão do Lead</span>
                  <p className="text-[10px] text-slate-400">
                    Itens cadastrados pelo Supervisor na Central de Cadastros para conformidade do atendimento.
                  </p>
                </div>
              </div>

              {(() => {
                let cardItems: any[] = [];
                const checklistId = card.checklists?.[0]?.id || "";
                if (card.checklists && card.checklists.length > 0) {
                  try {
                    cardItems = JSON.parse(card.checklists[0].items || "[]");
                  } catch {}
                }

                // Unir com checklist padrão do Supervisor
                const allItems = standardChecklists.length > 0
                  ? standardChecklists.map((sc) => {
                      const matched = cardItems.find((ci) => ci.id === sc.id || ci.text === sc.title);
                      return {
                        id: sc.id,
                        title: sc.title,
                        description: sc.description,
                        completed: Boolean(matched?.completed),
                      };
                    })
                  : cardItems.map((ci) => ({
                      id: ci.id,
                      title: ci.text,
                      description: null,
                      completed: Boolean(ci.completed),
                    }));

                const doneCount = allItems.filter((i) => i.completed).length;

                return (
                  <div className="space-y-3">
                    {allItems.length > 0 && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Progresso do Checklist:</span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {doneCount}/{allItems.length} concluídos ({Math.round((doneCount / allItems.length) * 100)}%)
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      {allItems.length > 0 ? (
                        allItems.map((it) => (
                          <label
                            key={it.id}
                            className={`p-3 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                              it.completed
                                ? "bg-emerald-50/40 border-emerald-200 text-slate-500"
                                : "bg-white border-slate-200 hover:border-blue-300 text-slate-800"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(it.completed)}
                              onChange={(e) => onToggleChecklist(card.id, checklistId, it.id, e.target.checked)}
                              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <div className="space-y-0.5 flex-1">
                              <span className={`text-xs font-semibold block ${it.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                                {it.title}
                              </span>
                              {it.description && (
                                <p className="text-[11px] text-slate-400">{it.description}</p>
                              )}
                            </div>
                            {it.completed && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                                Concluído
                              </span>
                            )}
                          </label>
                        ))
                      ) : (
                        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                          <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-600">Nenhum item de checklist configurado.</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Acesse a Central de Cadastros para cadastrar itens padrão de checklist pelo Supervisor.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <form onSubmit={handleSendComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escrever comentário ou nota de reunião..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </form>

              <div className="space-y-3">
                {card.comments &&
                  card.comments.map((cm: any) => (
                    <div key={cm.id} className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-bold text-blue-700">{cm.authorName}</span>
                        <span>{formatDate(cm.createdAt)}</span>
                      </div>
                      <p className="text-slate-800">{cm.content}</p>
                    </div>
                  ))}

                {card.activities &&
                  card.activities.map((act: any) => (
                    <div key={act.id} className="flex items-start gap-2 text-xs text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-slate-800 font-medium">{act.details}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{formatDate(act.createdAt)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800">Documentos e Receitas Médicas</span>
                  <p className="text-[10px] text-slate-400">Anexe fotos de receitas, contratos ou comprovantes</p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? "Enviando..." : "+ Subir Receita / Anexo"}</span>
                  </button>
                </div>
              </div>

              {(!card.attachments || card.attachments.length === 0) ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer"
                >
                  <Paperclip className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">Nenhum anexo ou receita médica vinculada a este card.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Clique para selecionar arquivos (PDF, PNG, JPG, até 10MB)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {card.attachments.map((att: any) => (
                    <div
                      key={att.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800">{att.fileName}</p>
                          <p className="text-[10px] text-slate-400">
                            {(att.sizeBytes / 1024).toFixed(1)} KB &bull; {att.mimeType} &bull; {formatDate(att.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-200 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Visualizar anexo</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded border border-slate-200 transition-colors"
                          title="Excluir anexo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
