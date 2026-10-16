"use client";

import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Workflow, Plus, Play, CheckCircle2, Clock, Zap, ArrowRight, ToggleLeft, ToggleRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AutomationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: pipeId } = use(params);
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("CARD_CREATED");
  const [actionType, setActionType] = useState("ASSIGN_USER");

  const fetchAutomations = async () => {
    try {
      const res = await fetch(`/api/automations?pipeId=${pipeId}`);
      const data = await res.json();
      setAutomations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, [pipeId]);

  const handleToggle = async (autoId: string, current: boolean) => {
    await fetch(`/api/automations/${autoId}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchAutomations();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pipeId,
        name,
        triggerType,
        actionType,
      }),
    });

    setName("");
    setIsModalOpen(false);
    fetchAutomations();
  };

  return (
    <AppShell pipeId={pipeId} userName="Gestor Comercial">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Central de Automações No-Code</h1>
            </div>
            <p className="text-xs text-slate-500">
              Configure regras automáticas de processo no estilo Pipefy (Gatilho &rarr; Ação).
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Automação</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center p-8 text-xs text-slate-400">Carregando automações...</div>
        ) : (
          <div className="grid gap-3">
            {automations.map((auto) => (
              <div
                key={auto.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900">{auto.name}</h3>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      Gatilho: {auto.triggerType}
                    </span>
                    <span>&rarr;</span>
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3 text-blue-500" />
                      Ação: {auto.actionType}
                    </span>
                    <span className="text-slate-400">
                      Execuções: <strong className="text-slate-700">{auto.executionsCount}</strong>
                    </span>
                    {auto.lastExecutedAt && (
                      <span className="text-slate-400">Última: {formatDate(auto.lastExecutedAt)}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(auto.id, auto.isActive)}
                  className={`p-1 text-xs font-medium rounded flex items-center gap-1 ${
                    auto.isActive ? "text-emerald-700 hover:text-emerald-800" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {auto.isActive ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Nova Regra de Automação</h3>
              <p className="text-xs text-slate-500 mb-4">
                Quando o evento disparar, a ação configurada será executada automaticamente.
              </p>

              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Regra</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Enviar e-mail de agradecimento após reunião"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quando isso acontecer (Gatilho)</label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="CARD_CREATED">Um novo Card/Lead for criado</option>
                    <option value="CARD_MOVED">Um Card for movido de fase</option>
                    <option value="FIELD_UPDATED">Um campo for atualizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Faça isso (Ação)</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="ASSIGN_USER">Atribuir responsável automaticamente</option>
                    <option value="SEND_EMAIL">Enviar e-mail automático com template</option>
                    <option value="MOVE_CARD">Mover card para outra fase</option>
                    <option value="TRIGGER_WEBHOOK">Disparar webhook HTTP</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm"
                  >
                    Ativar Automação
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
