"use client";

import { useState } from "react";
import { 
  X, 
  CheckSquare, 
  History, 
  AlertCircle,
  Send,
  Paperclip,
  FileText,
  Download
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface CardDrawerProps {
  card: any;
  phases: any[];
  fields: any[];
  onClose: () => void;
  onUpdateFields: (cardId: string, fieldValues: Record<string, string>) => Promise<void>;
  onMovePhase: (cardId: string, targetPhaseId: string, fieldValues?: Record<string, string>) => Promise<void>;
  onAddComment: (cardId: string, content: string) => Promise<void>;
  onToggleChecklist: (cardId: string, checklistId: string, itemId: string, completed: boolean) => Promise<void>;
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
}: CardDrawerProps) {
  const [activeTab, setActiveTab] = useState<"fields" | "checklist" | "activity" | "attachments">("fields");
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (card?.values) {
      for (const v of card.values) {
        map[v.field.identifier] = v.value;
      }
    }
    return map;
  });
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!card) return null;

  const currentPhase = phases.find((p) => p.id === card.currentPhaseId);
  const visibleFields = fields.filter((f) => !f.phaseId || f.phaseId === card.currentPhaseId);

  const handleFieldChange = (identifier: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [identifier]: value }));
  };

  const handleSaveFields = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await onUpdateFields(card.id, formValues);
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
      await onAddComment(card.id, newComment);
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">{card.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
                <span className="text-xs font-bold text-slate-700">Formulário de Informações</span>
                <button
                  onClick={handleSaveFields}
                  disabled={saving}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>

              {visibleFields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                  </label>

                  {field.type === "TEXTAREA" ? (
                    <textarea
                      rows={3}
                      value={formValues[field.identifier] || ""}
                      onChange={(e) => handleFieldChange(field.identifier, e.target.value)}
                      placeholder={field.placeholder || ""}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : field.type === "SELECT" ? (
                    <select
                      value={formValues[field.identifier] || ""}
                      onChange={(e) => handleFieldChange(field.identifier, e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
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
                      type={field.type === "NUMBER" || field.type === "CURRENCY" ? "number" : field.type === "DATE" ? "date" : "text"}
                      value={formValues[field.identifier] || ""}
                      onChange={(e) => handleFieldChange(field.identifier, e.target.value)}
                      placeholder={field.placeholder || ""}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block mb-2">Checklists da Fase</span>
              {card.checklists && card.checklists.length > 0 ? (
                card.checklists.map((cl: any) => {
                  const items: any[] = JSON.parse(cl.items || "[]");
                  return (
                    <div key={cl.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                      <span className="text-xs font-bold text-slate-800">{cl.title}</span>
                      <div className="space-y-1.5">
                        {items.map((it) => (
                          <label key={it.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(it.completed)}
                              onChange={(e) => onToggleChecklist(card.id, cl.id, it.id, e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span className={it.completed ? "line-through text-slate-400" : ""}>{it.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">Nenhum checklist configurado.</p>
              )}
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
                <span className="text-xs font-bold text-slate-700">Documentos e Receitas Médicas</span>
              </div>

              {(!card.attachments || card.attachments.length === 0) ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                  <Paperclip className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Nenhum anexo ou receita médica vinculada a este card.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Formatos aceitos: PDF, PNG, JPEG, DOCX (até 10MB)</p>
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
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-200 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Visualizar anexo</span>
                      </a>
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
