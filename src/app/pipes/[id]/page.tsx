"use client";

import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { CardDrawer } from "@/components/card/CardDrawer";
import { ListView } from "@/components/views/ListView";
import { TableView } from "@/components/views/TableView";
import { 
  LayoutGrid, 
  List, 
  Table as TableIcon, 
  Plus
} from "lucide-react";

export default function PipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: pipeId } = use(params);
  const [pipe, setPipe] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "table">("kanban");
  const [selectedCard, setSelectedCard] = useState<any>(null);

  // New Lead Modal State
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newLeadPhaseId, setNewLeadPhaseId] = useState<string | null>(null);
  const [newLeadTitle, setNewLeadTitle] = useState("");
  const [newLeadDate, setNewLeadDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadCampaign, setNewLeadCampaign] = useState("");
  const [newLeadStore, setNewLeadStore] = useState("");
  const [newLeadEstimatedVisit, setNewLeadEstimatedVisit] = useState("");
  const [newLeadValue, setNewLeadValue] = useState("");

  const fetchData = async () => {
    try {
      const [pRes, cRes, lRes, aRes, sRes, campRes] = await Promise.all([
        fetch(`/api/pipes/${pipeId}`),
        fetch(`/api/cards?pipeId=${pipeId}`),
        fetch(`/api/labels?pipeId=${pipeId}`),
        fetch(`/api/auth/me`),
        fetch(`/api/stores`),
        fetch(`/api/campaigns`),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      const lData = lRes.ok ? await lRes.json() : [];
      const aData = aRes.ok ? await aRes.json() : null;
      const sData = sRes.ok ? await sRes.json() : [];
      const campData = campRes.ok ? await campRes.json() : [];

      setPipe(pData);
      setCards(cData);
      setLabels(Array.isArray(lData) ? lData : []);
      if (aData?.user) setCurrentUser(aData.user);
      setStores(Array.isArray(sData) ? sData : []);
      setCampaigns(Array.isArray(campData) ? campData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pipeId]);

  const handleRenameCard = async (cardId: string, title: string) => {
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao renomear card.");
        return;
      }
      await fetchData();
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard((prev: any) => ({ ...prev, title }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleColorChange = async (cardId: string, color: string) => {
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao alterar cor do card.");
        return;
      }
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Deseja realmente excluir este lead permanentemente?")) return;
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao excluir o card.");
        return;
      }
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard(null);
      }
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyTag = async (cardId: string, labelId: string) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao atualizar etiqueta do card.");
        return;
      }
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const [drawerTab, setDrawerTab] = useState<"fields" | "checklist" | "activity" | "attachments">("fields");

  const handleOpenCard = async (card: any, tab: "fields" | "checklist" | "activity" | "attachments" = "fields") => {
    setDrawerTab(tab);
    const res = await fetch(`/api/cards/${card.id}`);
    const full = await res.json();
    setSelectedCard(full);
  };

  const handleMoveCard = async (cardId: string, targetPhaseId: string, fieldValues?: Record<string, string>) => {
    const res = await fetch(`/api/cards/${cardId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetPhaseId, fieldValues }),
    });
    const updated = await res.json();
    if (!res.ok) {
      alert(updated.error || "Erro ao mover card.");
      return;
    }

    await fetchData();
    if (selectedCard && selectedCard.id === cardId) {
      setSelectedCard(updated);
    }
  };

  const handleUpdateFields = async (cardId: string, fieldValues: Record<string, string>) => {
    const res = await fetch(`/api/cards/${cardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldValues }),
    });
    const updated = await res.json();
    if (!res.ok) throw new Error(updated.error || "Erro ao salvar.");
    await fetchData();
    setSelectedCard(updated);
  };

  const handleAddComment = async (cardId: string, content: string) => {
    await fetch(`/api/cards/${cardId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, authorName: "Equipe Comercial" }),
    });
    const res = await fetch(`/api/cards/${cardId}`);
    setSelectedCard(await res.json());
    await fetchData();
  };

  const handleToggleChecklist = async (cardId: string, checklistId: string, itemId: string, completed: boolean) => {
    await fetch(`/api/cards/${cardId}/checklist`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklistId, itemId, completed }),
    });
    const res = await fetch(`/api/cards/${cardId}`);
    setSelectedCard(await res.json());
    await fetchData();
  };

  const handleCreateNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadTitle.trim()) return;

    await fetch(`/api/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pipeId,
        phaseId: newLeadPhaseId || undefined,
        title: newLeadTitle.trim(),
        dealValue: parseFloat(newLeadValue) || 0,
        fieldValues: {
          lead_name: newLeadTitle.trim(),
          lead_date: newLeadDate,
          lead_phone: newLeadPhone.trim(),
          campaign_interest: newLeadCampaign,
          store_negotiated: newLeadStore,
          estimated_visit_datetime: newLeadEstimatedVisit,
          deal_value: newLeadValue,
        },
      }),
    });

    setNewLeadTitle("");
    setNewLeadPhone("");
    setNewLeadCampaign("");
    setNewLeadStore("");
    setNewLeadEstimatedVisit("");
    setNewLeadValue("");
    setNewLeadPhaseId(null);
    setIsNewLeadOpen(false);
    await fetchData();
  };

  if (loading) {
    return (
      <AppShell pipeId={pipeId}>
        <div className="flex items-center justify-center h-64 text-slate-400 text-xs font-semibold">
          Carregando processo e leads...
        </div>
      </AppShell>
    );
  }

  if (!pipe) {
    return (
      <AppShell pipeId={pipeId}>
        <div className="text-center p-12 text-slate-500">Pipe não encontrado.</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      pipeId={pipeId}
      userName={currentUser?.name || "Gestor Comercial"}
      userRole={currentUser?.role || "ADMIN"}
      allowedMenus={currentUser?.allowedMenus}
    >
      <div className="flex flex-col h-[calc(100vh-6.5rem)]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">{pipe.name}</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {cards.length} leads
              </span>
            </div>
            <p className="text-[11px] text-slate-500">{pipe.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold transition-colors ${
                  viewMode === "kanban" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
                title="Quadro Kanban"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold transition-colors ${
                  viewMode === "list" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
                title="Visualização em Lista"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold transition-colors ${
                  viewMode === "table" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
                title="Tabela de Dados"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabela</span>
              </button>
            </div>

            <button
              onClick={() => {
                setNewLeadPhaseId(null);
                setIsNewLeadOpen(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lead</span>
            </button>
          </div>
        </div>

        {/* Modal de Cadastro Completo de Lead para Lojas Físicas */}
        {isNewLeadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cadastrar Novo Lead</h3>
                  <p className="text-[11px] text-slate-500">Distribuição para Lojas Físicas de Ótica</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewLeadOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateNewLead} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nome do Lead / Contato *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Oliveira"
                    value={newLeadTitle}
                    onChange={(e) => setNewLeadTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Data do Contato</label>
                    <input
                      type="date"
                      value={newLeadDate}
                      onChange={(e) => setNewLeadDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={newLeadPhone}
                      onChange={(e) => setNewLeadPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Campanha de Interesse</label>
                    <select
                      value={newLeadCampaign}
                      onChange={(e) => setNewLeadCampaign(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Selecione uma campanha...</option>
                      {campaigns.map((camp) => (
                        <option key={camp.id} value={camp.name}>
                          {camp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Loja Negociada de Destino</label>
                    <select
                      value={newLeadStore}
                      onChange={(e) => setNewLeadStore(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Selecione a loja física...</option>
                      {stores.map((st) => (
                        <option key={st.id} value={st.name}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Data/Horário Estimada da Visita</label>
                    <input
                      type="datetime-local"
                      value={newLeadEstimatedVisit}
                      onChange={(e) => setNewLeadEstimatedVisit(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Valor Inicial Estimado (R$)</label>
                    <input
                      type="number"
                      placeholder="Ex: 850"
                      value={newLeadValue}
                      onChange={(e) => setNewLeadValue(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Fase Inicial no Funil</label>
                  <select
                    value={newLeadPhaseId || pipe.phases[0]?.id || ""}
                    onChange={(e) => setNewLeadPhaseId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {pipe.phases.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewLeadOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
                  >
                    Salvar Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-x-auto pt-3">
          {viewMode === "kanban" && (
            <div className="flex gap-3.5 items-start pb-4 min-w-max">
              {pipe.phases.map((phase: any) => (
                <KanbanColumn
                  key={phase.id}
                  phase={phase}
                  phases={pipe.phases}
                  cards={cards}
                  labels={labels}
                  onOpenCard={handleOpenCard}
                  onMoveCard={handleMoveCard}
                  onColorChange={handleColorChange}
                  onDeleteCard={handleDeleteCard}
                  onApplyTag={handleApplyTag}
                  onQuickAddLead={(phaseId) => {
                    setNewLeadPhaseId(phaseId);
                    setIsNewLeadOpen(true);
                  }}
                  onRenameCard={handleRenameCard}
                />
              ))}
            </div>
          )}

          {viewMode === "list" && (
            <div className="max-w-4xl mx-auto pb-6">
              <ListView phases={pipe.phases} cards={cards} onOpenCard={handleOpenCard} />
            </div>
          )}

          {viewMode === "table" && (
            <div className="max-w-5xl mx-auto pb-6">
              <TableView cards={cards} onOpenCard={handleOpenCard} />
            </div>
          )}
        </div>

        {selectedCard && (
          <CardDrawer
            card={selectedCard}
            phases={pipe.phases}
            fields={pipe.fields}
            defaultTab={drawerTab}
            onClose={() => setSelectedCard(null)}
            onUpdateFields={handleUpdateFields}
            onMovePhase={handleMoveCard}
            onAddComment={handleAddComment}
            onToggleChecklist={handleToggleChecklist}
            onDeleteCard={handleDeleteCard}
            onRenameCard={handleRenameCard}
          />
        )}
      </div>
    </AppShell>
  );
}
