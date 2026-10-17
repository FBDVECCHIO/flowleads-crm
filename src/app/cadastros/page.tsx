"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { 
  Building2, 
  Users, 
  Megaphone, 
  Tag, 
  Bell, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  ExternalLink, 
  Calendar, 
  AlertTriangle, 
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Phone,
  Layers,
  Sparkles,
  Info
} from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  isActive: boolean;
  sellers?: any[];
  _count?: { sellers: number };
}

interface SellerItem {
  id: string;
  name: string;
  role: "VENDEDOR" | "CAPTADOR";
  storeId?: string | null;
  store?: StoreItem | null;
  phone?: string | null;
  isActive: boolean;
}

interface CampaignItem {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  products?: string | null;
  eligibleStores?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface LabelItem {
  id: string;
  name: string;
  color: string;
  pipeId: string;
}

interface MessageItem {
  id: string;
  title: string;
  content: string;
  authorName: string;
  priority: string;
  createdAt: string;
}

const PRODUCT_OPTIONS = [
  { id: "armação", label: "Armação" },
  { id: "lente", label: "Lente" },
  { id: "óculos completo", label: "Óculos Completo" },
  { id: "óculos solar", label: "Óculos Solar" },
  { id: "lente de contato", label: "Lente de Contato" },
];

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#64748b", // Slate
];

export default function CadastrosPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [defaultPipeId, setDefaultPipeId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"lojas" | "vendedores" | "campanhas" | "tags" | "mensagens">("lojas");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Coleções de dados
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);

  // Estados de feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados dos modais
  const [modalType, setModalType] = useState<"store" | "seller" | "campaign" | "label" | "message" | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Estados de formulário
  const [storeForm, setStoreForm] = useState({ name: "", description: "", phone: "", isActive: true });
  const [sellerForm, setSellerForm] = useState({ name: "", role: "VENDEDOR", storeId: "", phone: "", isActive: true });
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
    products: [] as string[],
    eligibleStores: [] as string[],
    isActive: true,
  });
  const [labelForm, setLabelForm] = useState({ name: "", color: "#3b82f6" });
  const [messageForm, setMessageForm] = useState({ title: "", content: "", priority: "NORMAL", authorName: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [authRes, pipesRes, storesRes, sellersRes, campaignsRes, labelsRes, messagesRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/pipes"),
        fetch("/api/stores"),
        fetch("/api/sellers"),
        fetch("/api/campaigns"),
        fetch("/api/labels"),
        fetch("/api/messages"),
      ]);

      if (authRes.ok) {
        const authData = await authRes.json();
        setCurrentUser(authData.user);
      }

      if (pipesRes.ok) {
        const pipesData = await pipesRes.json();
        if (Array.isArray(pipesData) && pipesData.length > 0) {
          setDefaultPipeId(pipesData[0].id);
        }
      }

      if (storesRes.ok) setStores(await storesRes.json());
      if (sellersRes.ok) setSellers(await sellersRes.json());
      if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
      if (labelsRes.ok) setLabels(await labelsRes.json());
      if (messagesRes.ok) setMessages(await messagesRes.json());
    } catch (err: any) {
      console.error("Erro ao carregar dados da Central de Cadastros:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4500);
  };

  // --- Handlers: Lojas ---
  const handleOpenStoreModal = (store?: StoreItem) => {
    if (store) {
      setEditingItem(store);
      setStoreForm({
        name: store.name,
        description: store.description || "",
        phone: store.phone || "",
        isActive: store.isActive,
      });
    } else {
      setEditingItem(null);
      setStoreForm({ name: "", description: "", phone: "", isActive: true });
    }
    setModalType("store");
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/stores/${editingItem.id}` : "/api/stores";
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar loja.");
      showSuccess(editingItem ? "Loja atualizada com sucesso!" : "Loja física cadastrada com sucesso!");
      setModalType(null);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStore = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover a loja "${name}"?`)) return;
    try {
      const res = await fetch(`/api/stores/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover loja.");
      showSuccess("Loja removida!");
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // --- Handlers: Vendedores & Captadores ---
  const handleOpenSellerModal = (seller?: SellerItem) => {
    if (seller) {
      setEditingItem(seller);
      setSellerForm({
        name: seller.name,
        role: seller.role,
        storeId: seller.storeId || "",
        phone: seller.phone || "",
        isActive: seller.isActive,
      });
    } else {
      setEditingItem(null);
      setSellerForm({
        name: "",
        role: "VENDEDOR",
        storeId: stores[0]?.id || "",
        phone: "",
        isActive: true,
      });
    }
    setModalType("seller");
  };

  const handleSaveSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/sellers/${editingItem.id}` : "/api/sellers";
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sellerForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar colaborador.");
      showSuccess(editingItem ? "Colaborador atualizado com sucesso!" : "Colaborador cadastrado com sucesso!");
      setModalType(null);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSeller = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o colaborador "${name}"?`)) return;
    try {
      const res = await fetch(`/api/sellers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover colaborador.");
      showSuccess("Colaborador removido!");
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // --- Handlers: Campanhas ---
  const handleOpenCampaignModal = (camp?: CampaignItem) => {
    if (camp) {
      setEditingItem(camp);
      let parsedProducts: string[] = [];
      let parsedStores: string[] = [];
      try {
        parsedProducts = camp.products ? JSON.parse(camp.products) : [];
      } catch {
        parsedProducts = camp.products ? camp.products.split(",").map((s) => s.trim()) : [];
      }
      try {
        parsedStores = camp.eligibleStores ? JSON.parse(camp.eligibleStores) : [];
      } catch {
        parsedStores = camp.eligibleStores ? camp.eligibleStores.split(",").map((s) => s.trim()) : [];
      }

      setCampaignForm({
        name: camp.name,
        description: camp.description || "",
        imageUrl: camp.imageUrl || "",
        startDate: camp.startDate ? new Date(camp.startDate).toISOString().slice(0, 10) : "",
        endDate: camp.endDate ? new Date(camp.endDate).toISOString().slice(0, 10) : "",
        products: parsedProducts,
        eligibleStores: parsedStores,
        isActive: camp.isActive,
      });
    } else {
      setEditingItem(null);
      setCampaignForm({
        name: "",
        description: "",
        imageUrl: "",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        products: ["óculos completo"],
        eligibleStores: stores.map((s) => s.name),
        isActive: true,
      });
    }
    setModalType("campaign");
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/campaigns/${editingItem.id}` : "/api/campaigns";
      const method = editingItem ? "PUT" : "POST";
      const payload = {
        ...campaignForm,
        products: JSON.stringify(campaignForm.products),
        eligibleStores: JSON.stringify(campaignForm.eligibleStores),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar campanha.");
      showSuccess(editingItem ? "Campanha atualizada com sucesso!" : "Campanha Meta Ads cadastrada!");
      setModalType(null);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover a campanha "${name}"?`)) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover campanha.");
      showSuccess("Campanha removida!");
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // --- Handlers: Tags ---
  const handleOpenLabelModal = (lbl?: LabelItem) => {
    if (lbl) {
      setEditingItem(lbl);
      setLabelForm({ name: lbl.name, color: lbl.color });
    } else {
      setEditingItem(null);
      setLabelForm({ name: "", color: "#3b82f6" });
    }
    setModalType("label");
  };

  const handleSaveLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/labels/${editingItem.id}` : "/api/labels";
      const method = editingItem ? "PUT" : "POST";
      const payload = {
        ...labelForm,
        pipeId: defaultPipeId,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar etiqueta.");
      showSuccess(editingItem ? "Etiqueta atualizada!" : "Etiqueta criada!");
      setModalType(null);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLabel = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover a etiqueta "${name}"?`)) return;
    try {
      const res = await fetch(`/api/labels/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover etiqueta.");
      showSuccess("Etiqueta removida!");
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // --- Handlers: Mensagens (Sino) ---
  const handleOpenMessageModal = (msg?: MessageItem) => {
    if (msg) {
      setEditingItem(msg);
      setMessageForm({
        title: msg.title,
        content: msg.content,
        priority: msg.priority,
        authorName: msg.authorName,
      });
    } else {
      setEditingItem(null);
      setMessageForm({
        title: "",
        content: "",
        priority: "NORMAL",
        authorName: currentUser?.name || "Supervisor Geral",
      });
    }
    setModalType("message");
  };

  const handleSaveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/messages/${editingItem.id}` : "/api/messages";
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar comunicado.");
      showSuccess(editingItem ? "Comunicado atualizado!" : "Comunicado disparado para o Sino da equipe!");
      setModalType(null);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMessage = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente remover o comunicado "${title}"?`)) return;
    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover comunicado.");
      showSuccess("Comunicado removido!");
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  return (
    <AppShell
      pipeId={defaultPipeId}
      userName={currentUser?.name || "Supervisor"}
      userRole={currentUser?.role || "SUPERVISOR"}
      allowedMenus={currentUser?.allowedMenus}
    >
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Banner Superior de Governança */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-sm border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Nível Supervisor • Central de Cadastros</span>
              <span className="text-slate-500">•</span>
              <span>FlowLeads by Grupo Mário Neto</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Central de Cadastros Comerciais
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
              Gerencie lojas físicas, vendedores e captadores, campanhas de tráfego pago da Meta Ads, etiquetas exclusivas para os leads e avisos transmitidos no ícone do sino para toda a equipe.
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full bg-blue-600/10 pointer-events-none blur-3xl"></div>
        </div>

        {/* Notificações flutuantes */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Barra de Abas Principais */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setActiveTab("lojas"); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "lojas"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Lojas Físicas</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {stores.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("vendedores"); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "vendedores"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Vendedores & Captadores</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {sellers.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("campanhas"); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "campanhas"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>Campanhas Meta Ads</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {campaigns.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("tags"); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "tags"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Tags / Etiquetas</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {labels.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("mensagens"); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "mensagens"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Comunicados (Sino)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {messages.length}
              </span>
            </button>
          </div>

          <Link
            href="/users"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Gerenciar Logins & Metas</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Link>
        </div>

        {/* Conteúdo da Aba 1: LOJAS */}
        {activeTab === "lojas" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Lojas Físicas do Grupo</h2>
                <p className="text-xs text-slate-500">Unidades de atendimento para visita e fechamento presencial de leads</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou endereço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => handleOpenStoreModal()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Loja</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Nome da Loja</th>
                    <th className="py-3 px-4">Descrição / Endereço</th>
                    <th className="py-3 px-4">Telefone / WhatsApp</th>
                    <th className="py-3 px-4 text-center">Vendedores Vinculados</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stores
                    .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span>{s.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {s.description || <span className="text-slate-400 italic">Sem endereço</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-mono">
                          {s.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              {s.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Não informado</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {s._count?.sellers ?? (s.sellers ? s.sellers.length : 0)} colaboradores
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                          }`}>
                            {s.isActive ? "Ativa" : "Inativa"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenStoreModal(s)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              title="Editar Loja"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStore(s.id, s.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Excluir Loja"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {stores.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Nenhuma loja física cadastrada no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 2: VENDEDORES & CAPTADORES */}
        {activeTab === "vendedores" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Vendedores e Captadores de Loja</h2>
                <p className="text-xs text-slate-500">Membros de atendimento físico para cruzamento nas vendas e agendamentos</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome ou loja..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => handleOpenSellerModal()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Colaborador</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Nome do Colaborador</th>
                    <th className="py-3 px-4">Cargo</th>
                    <th className="py-3 px-4">Loja Vinculada</th>
                    <th className="py-3 px-4">WhatsApp Direto</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sellers
                    .filter((sl) => sl.name.toLowerCase().includes(searchTerm.toLowerCase()) || (sl.store && sl.store.name.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map((sl) => (
                      <tr key={sl.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {sl.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sl.role === "CAPTADOR" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {sl.role === "CAPTADOR" ? "Captador de Leads" : "Vendedor de Loja"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {sl.store?.name || <span className="text-slate-400 italic">Sem loja fixa</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-mono">
                          {sl.phone ? (
                            <a
                              href={`https://wa.me/${sl.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:underline inline-flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              {sl.phone}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sl.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                          }`}>
                            {sl.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenSellerModal(sl)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              title="Editar Colaborador"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSeller(sl.id, sl.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Excluir Colaborador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {sellers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Nenhum vendedor ou captador cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 3: CAMPANHAS META ADS */}
        {activeTab === "campanhas" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Campanhas de Anúncios (Meta Ads)</h2>
                <p className="text-xs text-slate-500">
                  Campanhas ativas usadas no cadastro manual de leads e roteamento automatizado
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome da campanha..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => handleOpenCampaignModal()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Campanha</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {campaigns
                .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase())))
                .map((c) => {
                  let prodList: string[] = [];
                  let storeList: string[] = [];
                  try { prodList = c.products ? JSON.parse(c.products) : []; } catch { prodList = c.products ? c.products.split(",") : []; }
                  try { storeList = c.eligibleStores ? JSON.parse(c.eligibleStores) : []; } catch { storeList = c.eligibleStores ? c.eligibleStores.split(",") : []; }

                  return (
                    <div key={c.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col bg-slate-50/50">
                      {c.imageUrl ? (
                        <div className="h-36 w-full overflow-hidden bg-slate-100 relative">
                          <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
                            c.isActive ? "bg-emerald-600/90 text-white" : "bg-slate-700/80 text-white"
                          }`}>
                            {c.isActive ? "Em Veiculação" : "Pausada"}
                          </span>
                        </div>
                      ) : (
                        <div className="h-28 w-full bg-gradient-to-r from-blue-900 to-indigo-900 flex items-center justify-center text-white relative">
                          <Megaphone className="w-8 h-8 opacity-40" />
                          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
                            c.isActive ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"
                          }`}>
                            {c.isActive ? "Em Veiculação" : "Pausada"}
                          </span>
                        </div>
                      )}

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {c.description || "Sem descrição informada."}
                          </p>
                        </div>

                        {/* Vigência */}
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            {c.startDate ? new Date(c.startDate).toLocaleDateString("pt-BR") : "Início imediato"}
                            {" até "}
                            {c.endDate ? new Date(c.endDate).toLocaleDateString("pt-BR") : "Indeterminado"}
                          </span>
                        </div>

                        {/* Produtos */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Produtos Ofertados:</span>
                          <div className="flex flex-wrap gap-1">
                            {prodList.map((p, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-semibold">
                                {p}
                              </span>
                            ))}
                            {prodList.length === 0 && <span className="text-slate-400 text-[10px]">Geral</span>}
                          </div>
                        </div>

                        {/* Lojas Hábeis */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lojas Hábeis:</span>
                          <div className="flex flex-wrap gap-1">
                            {storeList.map((st, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
                                {st}
                              </span>
                            ))}
                            {storeList.length === 0 && <span className="text-slate-400 text-[10px]">Todas as lojas</span>}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenCampaignModal(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Editar Campanha"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(c.id, c.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Excluir Campanha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {campaigns.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                  Nenhuma campanha cadastrada ainda. Clique em "+ Nova Campanha" para começar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 4: TAGS / ETIQUETAS */}
        {activeTab === "tags" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Etiquetas / Tags de Leads</h2>
                <p className="text-xs text-slate-500">
                  Governança exclusiva do Supervisor: tags padronizadas para classificar cards no Kanban
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenLabelModal()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Etiqueta</span>
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {labels.map((lbl) => (
                <div
                  key={lbl.id}
                  className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between bg-white hover:border-slate-300 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: lbl.color }}
                    />
                    <span className="font-bold text-slate-900 text-xs">{lbl.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenLabelModal(lbl)}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      title="Editar"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteLabel(lbl.id, lbl.name)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {labels.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  Nenhuma etiqueta cadastrada.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 5: MENSAGENS / COMUNICADOS DO SINO */}
        {activeTab === "mensagens" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Comunicados do Sino (Mensagens Gerais)</h2>
                <p className="text-xs text-slate-500">
                  Notificações enviadas pela Supervisão que aparecem no ícone do sino na barra lateral da equipe
                </p>
              </div>

              <button
                onClick={() => handleOpenMessageModal()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Comunicado</span>
              </button>
            </div>

            <div className="p-5 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-all ${
                    m.priority === "URGENTE" ? "bg-red-50/60 border-red-200" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {m.priority === "URGENTE" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          URGENTE
                        </span>
                      )}
                      <h3 className="font-bold text-slate-900 text-sm">{m.title}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        • {new Date(m.createdAt).toLocaleDateString("pt-BR")} às {new Date(m.createdAt).toLocaleTimeString("pt-BR").slice(0, 5)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-w-3xl">
                      {m.content}
                    </p>

                    <span className="text-[10px] text-slate-500 block">
                      Enviado por: <strong>{m.authorName || "Supervisor"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenMessageModal(m)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(m.id, m.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Nenhum comunicado cadastrado no momento.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: LOJA */}
        {modalType === "store" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? "Editar Loja Física" : "Cadastrar Nova Loja Física"}
                </h3>
                <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStore} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome da Loja *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ótica Mário Neto - Matriz Centro"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Endereço / Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Rua das Flores, 123 - Centro"
                    value={storeForm.description}
                    onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98888-0001"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="storeActive"
                    checked={storeForm.isActive}
                    onChange={(e) => setStoreForm({ ...storeForm, isActive: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="storeActive" className="text-slate-700 font-semibold cursor-pointer">
                    Loja Ativa para Captação de Leads
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                  >
                    {submitting ? "Salvando..." : "Salvar Loja"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: VENDEDOR & CAPTADOR */}
        {modalType === "seller" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? "Editar Colaborador" : "Cadastrar Colaborador de Loja"}
                </h3>
                <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSeller} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={sellerForm.name}
                    onChange={(e) => setSellerForm({ ...sellerForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cargo *</label>
                  <select
                    value={sellerForm.role}
                    onChange={(e) => setSellerForm({ ...sellerForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="VENDEDOR">Vendedor de Loja (Atendimento & Venda)</option>
                    <option value="CAPTADOR">Captador de Leads (Central / Recepção)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loja que Pertence *</label>
                  <select
                    value={sellerForm.storeId}
                    onChange={(e) => setSellerForm({ ...sellerForm, storeId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="">Selecione uma loja...</option>
                    {stores.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp de Contato</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-2222"
                    value={sellerForm.phone}
                    onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sellerActive"
                    checked={sellerForm.isActive}
                    onChange={(e) => setSellerForm({ ...sellerForm, isActive: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="sellerActive" className="text-slate-700 font-semibold cursor-pointer">
                    Colaborador Ativo
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                  >
                    {submitting ? "Salvando..." : "Salvar Colaborador"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CAMPANHA */}
        {modalType === "campaign" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? "Editar Campanha Meta Ads" : "Cadastrar Nova Campanha Meta Ads"}
                </h3>
                <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCampaign} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome da Campanha *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Campanha Óculos Completo Varilux 50% Off"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descrição / Gancho da Campanha</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Anúncio do Instagram promovendo consulta e lentes multifocais com desconto para maiores de 40 anos."
                    value={campaignForm.description}
                    onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL da Foto / Criativo da Campanha</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-1572635196237-14b3f281503f"
                    value={campaignForm.imageUrl}
                    onChange={(e) => setCampaignForm({ ...campaignForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Vigência */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Início da Vigência</label>
                    <input
                      type="date"
                      value={campaignForm.startDate}
                      onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fim da Vigência</label>
                    <input
                      type="date"
                      value={campaignForm.endDate}
                      onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Produtos Habilitados */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Produtos Promovidos</label>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_OPTIONS.map((prod) => {
                      const isSelected = campaignForm.products.includes(prod.id);
                      return (
                        <button
                          type="button"
                          key={prod.id}
                          onClick={() => {
                            const next = isSelected
                              ? campaignForm.products.filter((p) => p !== prod.id)
                              : [...campaignForm.products, prod.id];
                            setCampaignForm({ ...campaignForm, products: next });
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {prod.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lojas Hábeis */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Lojas Hábeis a Captar Leads desta Campanha</label>
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto">
                    {stores.map((st) => {
                      const isSelected = campaignForm.eligibleStores.includes(st.name);
                      return (
                        <label
                          key={st.id}
                          onClick={() => {
                            const next = isSelected
                              ? campaignForm.eligibleStores.filter((name) => name !== st.name)
                              : [...campaignForm.eligibleStores, st.name];
                            setCampaignForm({ ...campaignForm, eligibleStores: next });
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none text-[11px] ${
                            isSelected ? "bg-blue-50 border-blue-300 text-blue-900 font-semibold" : "bg-white border-slate-200 text-slate-600"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span className="truncate">{st.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="campActive"
                    checked={campaignForm.isActive}
                    onChange={(e) => setCampaignForm({ ...campaignForm, isActive: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="campActive" className="text-slate-700 font-semibold cursor-pointer">
                    Campanha Ativa no Meta Ads
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                  >
                    {submitting ? "Salvando..." : "Salvar Campanha"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ETIQUETA / TAG */}
        {modalType === "label" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? "Editar Etiqueta" : "Nova Etiqueta (Tag)"}
                </h3>
                <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveLabel} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome da Etiqueta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Receita Pendente, Urgente..."
                    value={labelForm.name}
                    onChange={(e) => setLabelForm({ ...labelForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Cor da Etiqueta</label>
                  <div className="flex items-center gap-2 mb-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setLabelForm({ ...labelForm, color: c })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          labelForm.color === c ? "scale-125 border-slate-900 shadow-md" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={labelForm.color}
                    onChange={(e) => setLabelForm({ ...labelForm, color: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-center"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                  >
                    {submitting ? "Salvando..." : "Salvar Etiqueta"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: COMUNICADO / MENSAGEM DO SINO */}
        {modalType === "message" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? "Editar Comunicado" : "Disparar Comunicado para o Sino"}
                </h3>
                <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMessage} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Título do Comunicado *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nova Campanha Meta Ads no ar!"
                    value={messageForm.title}
                    onChange={(e) => setMessageForm({ ...messageForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioridade</label>
                  <select
                    value={messageForm.priority}
                    onChange={(e) => setMessageForm({ ...messageForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="NORMAL">Normal (Informativo padrão)</option>
                    <option value="URGENTE">Urgente (Destaque em vermelho)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Conteúdo da Mensagem *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Escreva a orientação para os vendedores e captadores..."
                    value={messageForm.content}
                    onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assinado por (Autor)</label>
                  <input
                    type="text"
                    placeholder="Ex: Supervisor Geral"
                    value={messageForm.authorName}
                    onChange={(e) => setMessageForm({ ...messageForm, authorName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                  >
                    {submitting ? "Enviando..." : "Disparar Comunicado"}
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
