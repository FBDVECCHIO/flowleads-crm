"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { maskPhone } from "@/lib/utils";
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
  Info,
  CheckSquare,
  RefreshCw,
  Copy,
  Send,
  Zap,
  Code,
  Download,
  ChevronLeft,
  ChevronRight
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

interface ChecklistItemModel {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  isActive: boolean;
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

const CLOUDFLARE_WORKER_SAMPLE_CODE = [
  "// Cloudflare Worker: Meta Ads & WhatsApp CTWA -> FlowLeads CRM",
  "export default {",
  "  async fetch(request, env, ctx) {",
  '    if (request.method === "GET") {',
  '      return new Response("FlowLeads Worker OK", { status: 200 });',
  "    }",
  '    if (request.method !== "POST") {',
  '      return new Response("Method not allowed", { status: 405 });',
  "    }",
  "",
  "    try {",
  "      const payload = await request.json();",
  "",
  "      const leadData = {",
  '        name: payload.name || payload.full_name || "Lead WhatsApp",',
  '        phone: payload.phone || payload.phone_number || "",',
  '        destination_whatsapp: payload.destination_whatsapp || payload.to || "",',
  '        campaign_name: payload.campaign_name || payload.campaign || "Meta Ads CTWA",',
  '        adset_name: payload.adset_name || "",',
  '        ad_name: payload.ad_name || "",',
  "        dealValue: Number(payload.dealValue) || 0,",
  '        email: payload.email || "",',
  '        notes: payload.notes || payload.message || "Lead via Cloudflare Worker"',
  "      };",
  "",
  "      const webhookUrl = env.FLOWLEADS_WEBHOOK_URL",
  '        || "https://flowleads-crm-blush.vercel.app/api/webhooks/inbound";',
  "",
  "      const res = await fetch(webhookUrl, {",
  '        method: "POST",',
  '        headers: { "Content-Type": "application/json" },',
  "        body: JSON.stringify(leadData)",
  "      });",
  "",
  "      const data = await res.json();",
  "      return new Response(JSON.stringify(data), {",
  "        status: res.status,",
  '        headers: { "Content-Type": "application/json" }',
  "      });",
  "    } catch (err: any) {",
  "      return new Response(JSON.stringify({ error: err.message }), {",
  "        status: 500,",
  '        headers: { "Content-Type": "application/json" }',
  "      });",
  "    }",
  "  }",
  "};"
].join("\\n");

export default function CadastrosPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [defaultPipeId, setDefaultPipeId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"lojas" | "vendedores" | "campanhas" | "tags" | "mensagens" | "checklist" | "integracoes">("lojas");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [storePage, setStorePage] = useState(1);
  const [sellerPage, setSellerPage] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    setStorePage(1);
    setSellerPage(1);
  }, [searchTerm, activeTab]);

  // Coleções de dados
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemModel[]>([]);
  const [expandedStores, setExpandedStores] = useState<Record<string, boolean>>({});

  // Estados de Integração e Webhook
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedWorkerCode, setCopiedWorkerCode] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLeadForm, setTestLeadForm] = useState({
    name: "Lead Teste Meta Ads",
    phone: "(11) 98888-7777",
    destination_whatsapp: "",
    campaign_name: "CAMPANHA MULTIFOCAL CENTRO",
    dealValue: "1500",
  });

  const toggleStoreExpand = (storeId: string) => {
    setExpandedStores((prev) => ({
      ...prev,
      [storeId]: !prev[storeId],
    }));
  };

  // Estados de feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados dos modais
  const [modalType, setModalType] = useState<"store" | "seller" | "campaign" | "label" | "message" | "checklist" | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [syncingMeta, setSyncingMeta] = useState(false);

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
  const [checklistForm, setChecklistForm] = useState({ title: "", description: "", order: 1, isActive: true });

  const fetchData = async () => {
    try {
      setLoading(true);
      const cacheBust = `?_t=${Date.now()}`;
      const [authRes, pipesRes, storesRes, sellersRes, campaignsRes, labelsRes, messagesRes, checklistsRes] = await Promise.all([
        fetch(`/api/auth/me${cacheBust}`, { cache: "no-store" }),
        fetch(`/api/pipes${cacheBust}`, { cache: "no-store" }),
        fetch(`/api/stores${cacheBust}`, { cache: "no-store" }),
        fetch(`/api/sellers${cacheBust}`, { cache: "no-store" }),
        fetch(`/api/campaigns${cacheBust}`, { cache: "no-store" }),
        fetch(`/api/labels${cacheBust}`, { cache: "no-store" }),
        fetch(`/api/messages${cacheBust}`, { cache: "no-store" }),
        fetch(`/api/checklists${cacheBust}`, { cache: "no-store" }),
      ]);

      if (authRes.status === 401) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

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
      if (checklistsRes.ok) setChecklistItems(await checklistsRes.json());
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
      const payload = {
        ...storeForm,
        name: storeForm.name.trim().toUpperCase(),
        description: storeForm.description ? storeForm.description.trim().toUpperCase() : "",
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      const payload = {
        ...sellerForm,
        name: sellerForm.name.trim().toUpperCase(),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        name: campaignForm.name.trim().toUpperCase(),
        description: campaignForm.description ? campaignForm.description.trim().toUpperCase() : "",
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
      if (editingItem) {
        setCampaigns((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      } else {
        setCampaigns((prev) => [data, ...prev]);
      }
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover a campanha "${name}"?`)) return;
    const previous = [...campaigns];
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setCampaigns(previous);
        throw new Error("Erro ao remover campanha.");
      }
      showSuccess("Campanha removida!");
      await fetchData();
    } catch (err: any) {
      setCampaigns(previous);
      showError(err.message);
    }
  };

  const handleSyncMetaCampaigns = async () => {
    try {
      setSyncingMeta(true);
      const res = await fetch("/api/campaigns/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao espelhar campanhas da Meta.");
      showSuccess(data.message || "Campanhas espelhadas com sucesso da Meta Ads!");
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSyncingMeta(false);
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
        name: labelForm.name.trim().toUpperCase(),
        pipeId: defaultPipeId,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar etiqueta.");
      if (editingItem) {
        setLabels((prev) => prev.map((l) => (l.id === data.id ? data : l)));
      } else {
        setLabels((prev) => [...prev, data]);
      }
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao remover etiqueta.");
      }
      setLabels((prev) => prev.filter((l) => l.id !== id));
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
      const payload = {
        ...messageForm,
        title: messageForm.title.trim().toUpperCase(),
        content: messageForm.content.trim().toUpperCase(),
        authorName: messageForm.authorName?.trim().toUpperCase(),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // --- Handlers: Checklist (Supervisor) ---
  const handleOpenChecklistModal = (item?: ChecklistItemModel) => {
    if (item) {
      setEditingItem(item);
      setChecklistForm({
        title: item.title,
        description: item.description || "",
        order: item.order || 1,
        isActive: item.isActive,
      });
    } else {
      setEditingItem(null);
      setChecklistForm({
        title: "",
        description: "",
        order: checklistItems.length + 1,
        isActive: true,
      });
    }
    setModalType("checklist");
  };

  const handleSaveChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingItem ? `/api/checklists/${editingItem.id}` : "/api/checklists";
      const method = editingItem ? "PUT" : "POST";
      const payload = {
        ...checklistForm,
        title: checklistForm.title.trim(),
        description: checklistForm.description ? checklistForm.description.trim() : "",
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar item de checklist.");
      showSuccess(editingItem ? "Item de checklist atualizado!" : "Item de checklist cadastrado com sucesso!");
      setModalType(null);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChecklist = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente remover o item de checklist "${title}"?`)) return;
    try {
      const res = await fetch(`/api/checklists/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover item de checklist.");
      showSuccess("Item de checklist removido!");
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleToggleChecklistActive = async (item: ChecklistItemModel) => {
    try {
      const res = await fetch(`/api/checklists/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status.");
      showSuccess(`Item ${!item.isActive ? "ativado" : "desativado"} com sucesso!`);
      await fetchData();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleTestWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/webhooks/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: testLeadForm.name.trim(),
          phone: testLeadForm.phone.trim(),
          destination_whatsapp: testLeadForm.destination_whatsapp.trim() || undefined,
          campaign_name: testLeadForm.campaign_name.trim(),
          dealValue: Number(testLeadForm.dealValue) || 1500,
          platform: "SIMULADOR / TESTE INTERNO",
        }),
      });
      const data = await res.json();
      setTestResult(data);
      if (res.ok && data.success) {
        showSuccess(`Lead de teste ingerido com sucesso! Card criado no Kanban (ID: ${data.cardId?.slice(0, 8)}...).`);
      } else {
        showError(data.error || "Erro no disparo de teste do webhook.");
      }
    } catch (err: any) {
      showError(err.message || "Erro de rede ao conectar com o webhook.");
    } finally {
      setTestingWebhook(false);
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

        {/* Barra de Abas Principais - Linha única sem quebras */}
        <div className="flex flex-nowrap items-center justify-between gap-2 border-b border-slate-200 pb-2 overflow-x-auto whitespace-nowrap">
          <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
            <button
              onClick={() => { setActiveTab("lojas"); setSearchTerm(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "lojas"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Lojas</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                {stores.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("vendedores"); setSearchTerm(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "vendedores"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Vendedores</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                {sellers.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("campanhas"); setSearchTerm(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "campanhas"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Campanhas Meta</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                {campaigns.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("tags"); setSearchTerm(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "tags"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Tags</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                {labels.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("mensagens"); setSearchTerm(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "mensagens"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Comunicados</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                {messages.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("checklist"); setSearchTerm(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "checklist"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Checklist</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                {checklistItems.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("integracoes"); setSearchTerm(""); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === "integracoes"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Integrações & Webhook</span>
            </button>
          </div>

          <Link
            href="/users"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Gerenciar Logins & Metas</span>
            <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
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
                    <th className="py-3 px-4">Telefone / WhatsApp</th>
                    <th className="py-3 px-4 text-center">Vendedores Vinculados</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const filteredStores = stores.filter(
                      (s) =>
                        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                    const totalStorePages = Math.max(1, Math.ceil(filteredStores.length / PAGE_SIZE));
                    const currentStorePage = Math.min(storePage, totalStorePages);
                    const paginatedStores = filteredStores.slice(
                      (currentStorePage - 1) * PAGE_SIZE,
                      currentStorePage * PAGE_SIZE
                    );

                    if (paginatedStores.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            {searchTerm ? "Nenhuma loja encontrada para o filtro informado." : "Nenhuma loja física cadastrada no momento."}
                          </td>
                        </tr>
                      );
                    }

                    return paginatedStores.map((s) => (
                      <React.Fragment key={s.id}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="truncate">{s.name}</span>
                            <button
                              type="button"
                              onClick={() => toggleStoreExpand(s.id)}
                              className="ml-1.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors shrink-0"
                              title={expandedStores[s.id] ? "Ocultar descrição / endereço" : "Exibir descrição / endereço"}
                            >
                              {expandedStores[s.id] ? "−" : "+"}
                            </button>
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
                        {expandedStores[s.id] && (
                          <tr className="bg-blue-50/50 border-b border-blue-100/80 animate-in fade-in duration-150">
                            <td colSpan={5} className="py-2.5 px-6 text-xs text-slate-700">
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-slate-800 shrink-0">Descrição / Endereço:</span>
                                <span className="text-slate-600">
                                  {s.description || <span className="italic text-slate-400">Nenhum endereço ou descrição cadastrado para esta unidade.</span>}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* Barra de Paginação de Lojas (Limite de 25 linhas) */}
            {(() => {
              const filteredStores = stores.filter(
                (s) =>
                  s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
              );
              const totalStorePages = Math.max(1, Math.ceil(filteredStores.length / PAGE_SIZE));
              const currentStorePage = Math.min(storePage, totalStorePages);
              const startCount = filteredStores.length === 0 ? 0 : (currentStorePage - 1) * PAGE_SIZE + 1;
              const endCount = Math.min(currentStorePage * PAGE_SIZE, filteredStores.length);

              return (
                <div className="px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 text-xs text-slate-600">
                  <div className="font-medium">
                    Mostrando <span className="font-bold text-slate-900">{startCount}</span> a <span className="font-bold text-slate-900">{endCount}</span> de <span className="font-bold text-slate-900">{filteredStores.length}</span> lojas (25 por página)
                  </div>

                  {totalStorePages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentStorePage <= 1}
                        onClick={() => setStorePage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Anterior</span>
                      </button>

                      <span className="px-3 py-1 font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm">
                        {currentStorePage} / {totalStorePages}
                      </span>

                      <button
                        type="button"
                        disabled={currentStorePage >= totalStorePages}
                        onClick={() => setStorePage((p) => Math.min(totalStorePages, p + 1))}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <span>Próximo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
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
                  {(() => {
                    const filteredSellers = sellers.filter(
                      (sl) =>
                        sl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (sl.store && sl.store.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                    const totalSellerPages = Math.max(1, Math.ceil(filteredSellers.length / PAGE_SIZE));
                    const currentSellerPage = Math.min(sellerPage, totalSellerPages);
                    const paginatedSellers = filteredSellers.slice(
                      (currentSellerPage - 1) * PAGE_SIZE,
                      currentSellerPage * PAGE_SIZE
                    );

                    if (paginatedSellers.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            {searchTerm ? "Nenhum colaborador encontrado para o filtro informado." : "Nenhum vendedor ou captador cadastrado."}
                          </td>
                        </tr>
                      );
                    }

                    return paginatedSellers.map((sl) => (
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
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* Barra de Paginação de Vendedores (Limite de 25 linhas) */}
            {(() => {
              const filteredSellers = sellers.filter(
                (sl) =>
                  sl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (sl.store && sl.store.name.toLowerCase().includes(searchTerm.toLowerCase()))
              );
              const totalSellerPages = Math.max(1, Math.ceil(filteredSellers.length / PAGE_SIZE));
              const currentSellerPage = Math.min(sellerPage, totalSellerPages);
              const startCount = filteredSellers.length === 0 ? 0 : (currentSellerPage - 1) * PAGE_SIZE + 1;
              const endCount = Math.min(currentSellerPage * PAGE_SIZE, filteredSellers.length);

              return (
                <div className="px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 text-xs text-slate-600">
                  <div className="font-medium">
                    Mostrando <span className="font-bold text-slate-900">{startCount}</span> a <span className="font-bold text-slate-900">{endCount}</span> de <span className="font-bold text-slate-900">{filteredSellers.length}</span> colaboradores (25 por página)
                  </div>

                  {totalSellerPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentSellerPage <= 1}
                        onClick={() => setSellerPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Anterior</span>
                      </button>

                      <span className="px-3 py-1 font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm">
                        {currentSellerPage} / {totalSellerPages}
                      </span>

                      <button
                        type="button"
                        disabled={currentSellerPage >= totalSellerPages}
                        onClick={() => setSellerPage((p) => Math.min(totalSellerPages, p + 1))}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <span>Próximo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
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

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar campanhas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleSyncMetaCampaigns}
                  disabled={syncingMeta}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 border border-blue-400/30 disabled:opacity-60"
                  title="Espelhar campanhas oficiais da Conta de Anúncios Meta Ads"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingMeta ? "animate-spin" : ""}`} />
                  <span>{syncingMeta ? "Espelhando..." : "Espelhar Meta Ads"}</span>
                </button>
                <button
                  onClick={() => handleOpenCampaignModal()}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
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
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200/80">
                              Oficial Meta Ads
                            </span>
                            {c.description && c.description.includes("META ADS ID:") && (
                              <span className="text-[9px] font-mono text-slate-400">
                                {c.description.match(/META ADS ID:\s*([0-9]+)/)?.[0] || ""}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {c.description || "Sem descrição informada."}
                          </p>
                        </div>

                        {/* Crosscheck de Leads no CRM */}
                        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-semibold text-slate-700 text-[11px]">
                              Crosscheck CRM:
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md font-extrabold text-[11px] bg-white text-blue-900 border border-blue-200 shadow-2xs">
                              {(c as any).leadCount ?? 0} leads
                            </span>
                            <Link
                              href={`/pipes/${defaultPipeId}`}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 hover:underline"
                              title="Ver leads no Kanban"
                            >
                              <span>Ver</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
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

        {/* ABA: CHECKLIST (Configuração dos Itens pelo Supervisor) */}
        {activeTab === "checklist" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  Itens de Checklist dos Cards de Leads
                </h2>
                <p className="text-xs text-slate-500">
                  Cadastre os itens padronizados que a equipe comercial e os vendedores deverão marcar dentro do card de cada lead.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar itens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44"
                  />
                </div>

                <button
                  onClick={() => handleOpenChecklistModal()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Item de Checklist</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {checklistItems
                  .filter((item) => {
                    const q = searchTerm.toLowerCase();
                    return item.title.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                          {item.order}
                        </span>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">{item.title}</span>
                            <button
                              onClick={() => handleToggleChecklistActive(item)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                                item.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                              }`}
                              title="Clique para alternar status ativo/inativo"
                            >
                              {item.isActive ? "Ativo no Card" : "Inativo"}
                            </button>
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenChecklistModal(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteChecklist(item.id, item.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                {checklistItems.length === 0 && (
                  <div className="p-8 text-center space-y-2">
                    <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">Nenhum item de checklist cadastrado.</p>
                    <p className="text-[11px] text-slate-400">
                      Cadastre os itens que os usuários e vendedores devem verificar em cada lead.
                    </p>
                    <button
                      onClick={() => handleOpenChecklistModal()}
                      className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                    >
                      + Cadastrar Primeiro Item
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ABA: INTEGRAÇÕES & WEBHOOK META ADS / CLOUDFLARE WORKER */}
        {activeTab === "integracoes" && (
          <div className="space-y-6">
            {/* Header explicativo */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-blue-900/40 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative z-10 space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide uppercase">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Módulo de Ingestão de Leads
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Integrações & Webhook (Meta Ads & WhatsApp CTWA)
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Conecte seu Cloudflare Worker ou campanhas da Meta diretamente ao FlowLeads. Quando um lead clica no anúncio ou envia mensagem no WhatsApp comercial, o card é criado automaticamente na fase inicial e atribuído ao consultor responsável.
                </p>
              </div>

              <div className="relative z-10 shrink-0">
                <a
                  href="/Manual-Passo-a-Passo-Meta-Ads-FlowLeads.pdf"
                  target="_blank"
                  download="Manual-Passo-a-Passo-Meta-Ads-FlowLeads.pdf"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all border border-blue-400/40"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Baixar Manual em PDF Oficial</span>
                </a>
              </div>
            </div>

            {/* Grid de Configuração da URL de Webhook */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Card 1: FLOWLEADS_WEBHOOK_URL */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                      Variável de Ambiente Obrigatória
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">
                      FLOWLEADS_WEBHOOK_URL
                    </h3>
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Ativo & Liberado
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Utilize esta URL exata no seu script do Cloudflare Worker para encaminhar os dados dos leads recebidos:
                </p>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700">Endpoint Principal (Recomendado):</label>
                  <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-blue-400 transition-colors">
                    <code className="text-xs font-mono text-slate-800 truncate select-all font-semibold">
                      https://flowleads-crm-blush.vercel.app/api/webhooks/inbound
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("https://flowleads-crm-blush.vercel.app/api/webhooks/inbound");
                        setCopiedWebhookUrl(true);
                        setTimeout(() => setCopiedWebhookUrl(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                      title="Copiar URL do Webhook"
                    >
                      {copiedWebhookUrl ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-bold text-slate-700">Endpoint Alternativo (Padrão v1):</label>
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <code className="text-[11px] font-mono text-slate-700 truncate select-all">
                      https://flowleads-crm-blush.vercel.app/api/v1/webhook/inbound
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("https://flowleads-crm-blush.vercel.app/api/v1/webhook/inbound");
                        showSuccess("Endpoint v1 copiado para a área de transferência!");
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                      title="Copiar Endpoint v1"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700">POST</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700">Content-Type: application/json</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">Público (sem cookies de sessão)</span>
                </div>
              </div>

              {/* Card 2: Regra Mandatória de Roteamento por WhatsApp */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md">
                    Regra Mandatória de Distribuição
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">
                    Roteamento por WhatsApp Comercial do Vendedor
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  O roteamento não é baseado em bandeiras genéricas. O que determina o vendedor responsável é o <strong>contato de WhatsApp comercial</strong> configurado no grupo de anúncios da Meta Ads.
                </p>

                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2 text-xs text-purple-950">
                  <div className="font-bold flex items-center gap-1.5 text-purple-900">
                    <Phone className="w-4 h-4 text-purple-600 shrink-0" />
                    Como funciona o algoritmo:
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-purple-900/90">
                    <li>O Cloudflare Worker envia o campo <code>destination_whatsapp</code> com o número que recebeu o anúncio.</li>
                    <li>O FlowLeads compara com o WhatsApp cadastrado dos vendedores (ex: final <strong>45</strong>).</li>
                    <li>Se houver correspondência, o lead é atribuído <strong>diretamente ao vendedor dono do número</strong>.</li>
                    <li>Caso o número não coincida com nenhum vendedor, o lead vai para o <strong>Supervisor</strong> para triagem.</li>
                  </ol>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Vendedores com WhatsApp ativo:</span>
                  <span className="font-bold text-slate-900">
                    {sellers.filter((s) => Boolean(s.phone)).length} de {sellers.length} cadastrados
                  </span>
                </div>
              </div>
            </div>

            {/* Simulador ao Vivo & Código do Cloudflare Worker */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Simulador de Lead ao Vivo */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Send className="w-4 h-4 text-blue-600" />
                      Simulador de Lead (Teste ao Vivo)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Dispare uma chamada real ao webhook para testar a recepção e o roteamento imediatamente
                    </p>
                  </div>
                </div>

                <form onSubmit={handleTestWebhook} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Nome do Lead:</label>
                      <input
                        type="text"
                        required
                        value={testLeadForm.name}
                        onChange={(e) => setTestLeadForm({ ...testLeadForm, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Ex: Maria Silva"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Telefone / WhatsApp do Lead:</label>
                      <input
                        type="text"
                        required
                        value={testLeadForm.phone}
                        onChange={(e) => setTestLeadForm({ ...testLeadForm, phone: maskPhone(e.target.value) })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="(11) 98888-7777"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        WhatsApp de Destino (Vendedor / Anúncio):
                      </label>
                      <select
                        value={testLeadForm.destination_whatsapp}
                        onChange={(e) => setTestLeadForm({ ...testLeadForm, destination_whatsapp: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      >
                        <option value="">Nenhum (Triagem pelo Supervisor)</option>
                        {sellers.map((s) => (
                          <option key={s.id} value={s.phone || ""}>
                            {s.name} {s.phone ? `(${maskPhone(s.phone)})` : "(Sem telefone)"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Campanha de Interesse:</label>
                      <input
                        type="text"
                        value={testLeadForm.campaign_name}
                        onChange={(e) => setTestLeadForm({ ...testLeadForm, campaign_name: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Ex: CAMPANHA MULTIFOCAL VARILUX"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Valor Inicial Estimado (R$):</label>
                    <input
                      type="number"
                      value={testLeadForm.dealValue}
                      onChange={(e) => setTestLeadForm({ ...testLeadForm, dealValue: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="1500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={testingWebhook}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {testingWebhook ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Disparando requisição ao webhook...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>🚀 Disparar Lead de Teste para o Webhook</span>
                      </>
                    )}
                  </button>
                </form>

                {testResult && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Resultado da Ingestão:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        HTTP 200 OK
                      </span>
                    </div>
                    <pre className="p-2 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                    {defaultPipeId && (
                      <Link
                        href={`/pipes/${defaultPipeId}`}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs mt-1"
                      >
                        <span>Abrir Kanban de Leads para conferir o Card</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Código Pronto do Cloudflare Worker */}
              <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                      <Code className="w-4 h-4" />
                      Script do Cloudflare Worker (worker.js)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(CLOUDFLARE_WORKER_SAMPLE_CODE);
                        setCopiedWorkerCode(true);
                        setTimeout(() => setCopiedWorkerCode(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      {copiedWorkerCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Código Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Copie e cole este script diretamente no seu Cloudflare Worker e configure a variável <code>FLOWLEADS_WEBHOOK_URL</code>:
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72 leading-relaxed select-all">
                  <pre>{CLOUDFLARE_WORKER_SAMPLE_CODE}</pre>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <Link
                    href="/protocolo-meta"
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5"
                  >
                    <span>Ver Protocolo Técnico Completo Meta Ads</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
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
                    onChange={(e) => setStoreForm({ ...storeForm, phone: maskPhone(e.target.value) })}
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
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
                    onChange={(e) => setSellerForm({ ...sellerForm, phone: maskPhone(e.target.value) })}
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

        {/* MODAL: ITEM DE CHECKLIST */}
        {modalType === "checklist" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingItem ? "Editar Item de Checklist" : "Novo Item de Checklist do Lead"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Definido pelo Supervisor para aparecer como opção selecionável no card de lead.
                  </p>
                </div>
                <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveChecklist} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Título / Tarefa de Verificação *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Verificar Receita Oftalmológica Válida"
                    value={checklistForm.title}
                    onChange={(e) => setChecklistForm({ ...checklistForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Descrição / Instruções aos Vendedores</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Verificar data de emissão médica (máximo 1 ano) e CRM do oftalmologista..."
                    value={checklistForm.description}
                    onChange={(e) => setChecklistForm({ ...checklistForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ordem de Exibição</label>
                    <input
                      type="number"
                      min={1}
                      value={checklistForm.order}
                      onChange={(e) => setChecklistForm({ ...checklistForm, order: Number(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={checklistForm.isActive}
                        onChange={(e) => setChecklistForm({ ...checklistForm, isActive: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Item Ativo nos Cards</span>
                    </label>
                  </div>
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
                    {submitting ? "Salvando..." : "Salvar Item"}
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
