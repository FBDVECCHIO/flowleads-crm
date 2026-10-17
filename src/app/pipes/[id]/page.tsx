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
  Plus,
  Columns3,
  X
} from "lucide-react";
import { maskPhone } from "@/lib/utils";

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

  // Checklist State
  const [standardChecklists, setStandardChecklists] = useState<any[]>([]);

  // New Column / Phase Modal State
  const [isNewPhaseModalOpen, setIsNewPhaseModalOpen] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");

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
      const t = Date.now();
      const [pRes, cRes, lRes, aRes, sRes, campRes, chkRes] = await Promise.all([
        fetch(`/api/pipes/${pipeId}?_t=${t}`, { cache: "no-store" }),
        fetch(`/api/cards?pipeId=${pipeId}&_t=${t}`, { cache: "no-store" }),
        fetch(`/api/labels?pipeId=${pipeId}&_t=${t}`, { cache: "no-store" }),
        fetch(`/api/auth/me?_t=${t}`, { cache: "no-store" }),
        fetch(`/api/stores?_t=${t}`, { cache: "no-store" }),
        fetch(`/api/campaigns?_t=${t}`, { cache: "no-store" }),
        fetch(`/api/checklists?_t=${t}`, { cache: "no-store" }),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setPipe(pData);
      } else {
        try {
          const listRes = await fetch(`/api/pipes?_t=${t}`, { cache: "no-store" });
          if (listRes.ok) {
            const listData = await listRes.json();
            if (Array.isArray(listData) && listData.length > 0) {
              window.location.href = `/pipes/${listData[0].id}`;
              return;
            }
          }
        } catch {}
        setPipe(null);
      }

      const cData = cRes.ok ? await cRes.json() : [];
      const lData = lRes.ok ? await lRes.json() : [];
      const aData = aRes.ok ? await aRes.json() : null;
      const sData = sRes.ok ? await sRes.json() : [];
      const campData = campRes.ok ? await campRes.json() : [];
      const chkData = chkRes.ok ? await chkRes.json() : [];

      setCards(Array.isArray(cData) ? cData : []);
      setLabels(Array.isArray(lData) ? lData : []);
      if (aData?.user) setCurrentUser(aData.user);
      setStores(Array.isArray(sData) ? sData : []);
      setCampaigns(Array.isArray(campData) ? campData : []);
      setStandardChecklists(Array.isArray(chkData) ? chkData : []);
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
    const cleanTitle = title.trim().toUpperCase();
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, title: cleanTitle } : c)));
    if (selectedCard && selectedCard.id === cardId) {
      setSelectedCard((prev: any) => ({ ...prev, title: cleanTitle }));
    }
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: cleanTitle }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao renomear card.");
        await fetchData();
        return;
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      await fetchData();
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
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    if (selectedCard && selectedCard.id === cardId) {
      setSelectedCard(null);
    }
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao excluir o card.");
        await fetchData();
        return;
      }
      await fetchData();
    } catch (err) {
      console.error(err);
      await fetchData();
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
    const res = await fetch(`/api/cards/${card.id}?_t=${Date.now()}`, { cache: "no-store" });
    const full = await res.json();
    setSelectedCard(full);
  };

  const handleMoveCard = async (cardId: string, targetPhaseId: string, fieldValues?: Record<string, string>) => {
    const card = cards.find((c) => c.id === cardId) || selectedCard;
    const currentPhase = pipe?.phases?.find((p: any) => p.id === card?.currentPhaseId);

    // Regra de Negócio: Para movimentar saindo de Novo Lead para o próximo passo, é obrigatório loja e data/hora da visita
    const isMovingOutOfInitial = (currentPhase?.order === 1 || /novo/i.test(currentPhase?.name || "")) &&
      targetPhaseId !== currentPhase?.id;

    if (isMovingOutOfInitial) {
      const getVal = (id: string) => {
        if (fieldValues && fieldValues[id]) return fieldValues[id];
        const v = card?.values?.find((val: any) => val.field?.identifier === id);
        return v?.value ? String(v.value).trim() : "";
      };

      const hasStore = Boolean(getVal("store_negotiated"));
      const hasVisit = Boolean(getVal("estimated_visit_datetime"));

      if (!hasStore || !hasVisit) {
        alert("Atenção: Para movimentar o lead para o próximo passo, é OBRIGATÓRIO preencher a LOJA NEGOCIADA e a DATA E HORA DA VISITA À LOJA.\n\nO formulário do lead será aberto agora para preenchimento.");
        if (card) {
          handleOpenCard(card, "fields");
        }
        return;
      }
    }

    // Otimistic update
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, currentPhaseId: targetPhaseId } : c)));

    try {
      const res = await fetch(`/api/cards/${cardId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPhaseId, fieldValues }),
      });
      const updated = await res.json();
      if (!res.ok) {
        alert(updated.error || "Erro ao mover card.");
        await fetchData();
        return;
      }

      await fetchData();
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard(updated);
      }
    } catch (err) {
      console.error(err);
      await fetchData();
    }
  };

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim()) return;
    const cleanName = newPhaseName.trim().toUpperCase();
    try {
      const res = await fetch(`/api/phases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeId, name: cleanName, color: "#0b66c3" }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao criar coluna.");
        return;
      }
      setNewPhaseName("");
      setIsNewPhaseModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenamePhase = async (phaseId: string, currentName: string) => {
    const newName = prompt("Digite o novo nome para esta coluna / fase:", currentName);
    if (!newName || !newName.trim() || newName.trim().toUpperCase() === currentName.toUpperCase()) return;
    try {
      const res = await fetch(`/api/phases/${phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao renomear coluna.");
        return;
      }
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePhase = async (phaseId: string, phaseName: string) => {
    if (!confirm(`Deseja realmente excluir a coluna "${phaseName}"?\nTodos os leads existentes nela serão transferidos para "Novo Lead".`)) return;
    try {
      const res = await fetch(`/api/phases/${phaseId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao excluir coluna.");
        return;
      }
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMovePhaseDirection = async (phaseId: string, direction: "left" | "right") => {
    try {
      const res = await fetch(`/api/phases/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeId, phaseId, direction }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao movimentar coluna.");
        return;
      }
      await fetchData();
    } catch (err) {
      console.error("Erro ao movimentar coluna:", err);
    }
  };

  const handleReorderPhases = async (phaseIds: string[]) => {
    try {
      const res = await fetch(`/api/phases/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeId, phaseIds }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao reordenar colunas.");
        return;
      }
      await fetchData();
    } catch (err) {
      console.error("Erro ao reordenar colunas:", err);
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
    const res = await fetch(`/api/cards/${cardId}?_t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) setSelectedCard(await res.json());
    await fetchData();
  };

  const handleToggleChecklist = async (cardId: string, checklistId: string, itemId: string, completed: boolean) => {
    await fetch(`/api/cards/${cardId}/checklist`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklistId, itemId, completed }),
    });
    const res = await fetch(`/api/cards/${cardId}?_t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) setSelectedCard(await res.json());
    await fetchData();
  };

  const handleCreateNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadTitle.trim()) return;

    const cleanTitle = newLeadTitle.trim().toUpperCase();
    const cleanPhone = maskPhone(newLeadPhone.trim());
    const cleanCampaign = newLeadCampaign.trim().toUpperCase();
    const cleanStore = newLeadStore.trim().toUpperCase();
    const cleanVisit = newLeadEstimatedVisit.trim().toUpperCase();

    await fetch(`/api/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pipeId,
        phaseId: newLeadPhaseId || undefined,
        title: cleanTitle,
        dealValue: parseFloat(newLeadValue) || 0,
        fieldValues: {
          lead_name: cleanTitle,
          lead_date: newLeadDate,
          lead_phone: cleanPhone,
          campaign_interest: cleanCampaign,
          store_negotiated: cleanStore,
          estimated_visit_datetime: cleanVisit,
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

  if (!pipe || !Array.isArray(pipe.phases)) {
    return (
      <AppShell pipeId={pipeId}>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-xs font-semibold space-y-3">
          <span>Carregando processo e leads...</span>
          <button
            onClick={() => (window.location.href = "/pipes")}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Acessar Funil Padrão
          </button>
        </div>
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
              onClick={() => setIsNewPhaseModalOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1 border border-slate-200"
              title="Cadastrar Nova Coluna / Fase no Funil"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Nova Coluna</span>
            </button>

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

        {/* Modal de Nova Coluna / Fase */}
        {isNewPhaseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-5 max-w-sm w-full">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase">Criar Nova Coluna</h3>
                <button
                  type="button"
                  onClick={() => setIsNewPhaseModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePhase} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nome da Nova Coluna *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Visita Agendada"
                    value={newPhaseName}
                    onChange={(e) => setNewPhaseName(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    A coluna será inserida no funil com opções para renomear e excluir a qualquer momento.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewPhaseModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm"
                  >
                    Criar Coluna
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Cadastro Completo de Lead para Lojas Físicas */}
        {isNewLeadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">Cadastrar Novo Lead</h3>
                  <p className="text-[11px] text-slate-500">Distribuição para Lojas Físicas de Ótica</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewLeadOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewLead} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nome do Lead / Contato *</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: CARLOS OLIVEIRA"
                    value={newLeadTitle}
                    onChange={(e) => setNewLeadTitle(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
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
                      onChange={(e) => setNewLeadPhone(maskPhone(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Campanha de Interesse</label>
                    <select
                      value={newLeadCampaign}
                      onChange={(e) => setNewLeadCampaign(e.target.value.toUpperCase())}
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
                      onChange={(e) => setNewLeadStore(e.target.value.toUpperCase())}
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
                  standardChecklists={standardChecklists}
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
                  onRenamePhase={handleRenamePhase}
                  onDeletePhase={handleDeletePhase}
                  onMovePhaseDirection={handleMovePhaseDirection}
                  onReorderPhases={handleReorderPhases}
                />
              ))}

              {/* Botão + Nova Coluna no Quadro Kanban */}
              <div className="w-72 shrink-0 pt-1">
                <button
                  onClick={() => setIsNewPhaseModalOpen(true)}
                  className="w-full py-4 px-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-500 hover:text-blue-600 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  title="Cadastrar Nova Coluna / Fase no Funil"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ NOVA COLUNA</span>
                </button>
              </div>
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
