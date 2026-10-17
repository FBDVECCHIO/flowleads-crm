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
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "table">("kanban");
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newLeadTitle, setNewLeadTitle] = useState("");
  const [newLeadValue, setNewLeadValue] = useState("");

  const fetchData = async () => {
    try {
      const [pRes, cRes, lRes, aRes] = await Promise.all([
        fetch(`/api/pipes/${pipeId}`),
        fetch(`/api/cards?pipeId=${pipeId}`),
        fetch(`/api/labels?pipeId=${pipeId}`),
        fetch(`/api/auth/me`),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      const lData = lRes.ok ? await lRes.json() : [];
      const aData = aRes.ok ? await aRes.json() : null;

      setPipe(pData);
      setCards(cData);
      setLabels(Array.isArray(lData) ? lData : []);
      if (aData?.user) setCurrentUser(aData.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pipeId]);

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
        title: newLeadTitle,
        dealValue: parseFloat(newLeadValue) || 0,
      }),
    });
    setNewLeadTitle("");
    setNewLeadValue("");
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
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{pipe.name}</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {cards.length} leads
              </span>
            </div>
            <p className="text-xs text-slate-500">{pipe.description}</p>
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
              onClick={() => setIsNewLeadOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lead</span>
            </button>
          </div>
        </div>

        {isNewLeadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Cadastrar Novo Lead</h3>
              <p className="text-xs text-slate-500 mb-4">Insira o lead diretamente na fase inicial do funil.</p>
              <form onSubmit={handleCreateNewLead} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Título / Empresa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Farmácia Popular - Projeto CRM"
                    value={newLeadTitle}
                    onChange={(e) => setNewLeadTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
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

        <div className="flex-1 overflow-x-auto pt-4">
          {viewMode === "kanban" && (
            <div className="flex gap-4 items-start pb-4 min-w-max">
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
                  onQuickAddLead={() => setIsNewLeadOpen(true)}
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
          />
        )}
      </div>
    </AppShell>
  );
}
