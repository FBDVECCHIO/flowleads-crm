"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatCurrency, maskPhone } from "@/lib/utils";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  MessageSquare, 
  Target, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  Trash2, 
  Search, 
  Sparkles, 
  Check, 
  ExternalLink,
  Layers,
  Eye,
  EyeOff
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  whatsappNumber?: string | null;
  monthlyTargetAmount?: number | null;
  monthlyTargetDeals?: number | null;
  workingDaysPerMonth?: number | null;
  allowedMenus?: string | null;
  allowedDays?: string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  createdAt: string;
}

const AVAILABLE_MENUS = [
  { key: "metas", label: "Gestão de Metas", defaultChecked: true },
  { key: "kanban", label: "Kanban de Leads", defaultChecked: true },
  { key: "reports", label: "Relatórios & Funil", defaultChecked: true },
  { key: "cadastros", label: "Central de Cadastros", defaultChecked: false },
  { key: "automations", label: "Automações No-Code", defaultChecked: false },
  { key: "users", label: "Gestão de Usuários", defaultChecked: false },
];

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [defaultPipeId, setDefaultPipeId] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER",
    whatsappNumber: "",
    monthlyTargetAmount: 100000,
    monthlyTargetDeals: 10,
    workingDaysPerMonth: 22,
    allowedMenus: ["metas", "kanban", "reports"],
    allowedDays: "1,2,3,4,5",
    workStartTime: "08:00",
    workEndTime: "18:00",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const cacheBust = `?_t=${Date.now()}`;
      const [authRes, usersRes, pipesRes] = await Promise.all([
        fetch(`/api/auth/me${cacheBust}`, { cache: "no-store" }),
        fetch(`/api/users${cacheBust}`, { cache: "no-store" }),
        fetch(`/api/pipes${cacheBust}`, { cache: "no-store" }),
      ]);

      if (authRes.status === 401) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      const authData = await authRes.json();
      setCurrentUser(authData.user);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (pipesRes.ok) {
        const pipesData = await pipesRes.json();
        if (Array.isArray(pipesData) && pipesData.length > 0) {
          setDefaultPipeId(pipesData[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "MEMBER",
      whatsappNumber: "",
      monthlyTargetAmount: 100000,
      monthlyTargetDeals: 10,
      workingDaysPerMonth: 22,
      allowedMenus: ["metas", "kanban", "reports"],
      allowedDays: "1,2,3,4,5",
      workStartTime: "08:00",
      workEndTime: "18:00",
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserItem) => {
    setEditingUser(u);
    const menus = typeof u.allowedMenus === "string"
      ? u.allowedMenus.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : ["metas", "kanban", "reports"];

    setFormData({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      whatsappNumber: u.whatsappNumber || "",
      monthlyTargetAmount: u.monthlyTargetAmount ?? 100000,
      monthlyTargetDeals: u.monthlyTargetDeals ?? 10,
      workingDaysPerMonth: u.workingDaysPerMonth ?? 22,
      allowedMenus: menus,
      allowedDays: u.allowedDays || "1,2,3,4,5",
      workStartTime: u.workStartTime || "08:00",
      workEndTime: u.workEndTime || "18:00",
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const toggleMenuSelection = (key: string) => {
    setFormData((prev) => {
      const exists = prev.allowedMenus.includes(key);
      const next = exists
        ? prev.allowedMenus.filter((k) => k !== key)
        : [...prev.allowedMenus, key];
      return { ...prev, allowedMenus: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        ...formData,
        name: formData.name.trim().toUpperCase(),
        whatsappNumber: formData.whatsappNumber ? maskPhone(formData.whatsappNumber) : null,
        allowedMenus: formData.allowedMenus.join(","),
      };

      if (editingUser) {
        // PATCH
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao atualizar usuário.");
        setUsers((prev) => prev.map((u) => (u.id === data.id ? { ...u, ...data } : u)));
        setSuccessMessage("Usuário atualizado com sucesso!");
      } else {
        // POST
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao cadastrar usuário.");
        setUsers((prev) => [...prev, data]);
        setSuccessMessage("Usuário cadastrado com sucesso!");
      }

      await fetchData();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: UserItem) => {
    if (!confirm(`Tem certeza que deseja remover o usuário ${user.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const previousUsers = [...users];
    setUsers((prev) => prev.filter((u) => u.id !== user.id));

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setUsers(previousUsers);
        throw new Error(data.error || "Erro ao remover usuário.");
      }
      await fetchData();
    } catch (err: any) {
      setUsers(previousUsers);
      alert(err.message);
    }
  };

  const isSupervisor = currentUser?.role === "ADMIN" || currentUser?.role === "SUPERVISOR";

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.whatsappNumber && u.whatsappNumber.includes(q))
    );
  });

  const totalMembers = users.filter((u) => u.role === "MEMBER").length;
  const totalSupervisors = users.filter((u) => u.role === "ADMIN" || u.role === "SUPERVISOR").length;

  return (
    <AppShell
      pipeId={defaultPipeId}
      userName={currentUser?.name || "Supervisor"}
      userRole={currentUser?.role || "SUPERVISOR"}
      allowedMenus={currentUser?.allowedMenus}
    >
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Banner de Cabeçalho */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-sm border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Painel de Governança & Equipe</span>
              <span className="text-slate-500">•</span>
              <span>FlowLeads by Grupo Mário Neto</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gestão de Usuários & Vendedores
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
              Cadastre vendedores, vincule números de WhatsApp para roteamento de leads das campanhas da Meta Ads, estipule metas com dias úteis e controle as camadas de acesso aos menus do sistema.
            </p>

            {isSupervisor && (
              <div className="pt-2">
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Novo Vendedor / Usuário</span>
                </button>
              </div>
            )}
          </div>
          <div className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full bg-blue-600/10 pointer-events-none blur-3xl"></div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total da Equipe</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{users.length}</div>
              <span className="text-[11px] text-slate-400">Usuários registrados</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consultores / Vendedores</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{totalMembers}</div>
              <span className="text-[11px] text-slate-400">Recebem leads da Meta</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supervisores & Admins</span>
              <div className="text-2xl font-extrabold text-purple-600 mt-1">{totalSupervisors}</div>
              <span className="text-[11px] text-slate-400">Acesso Master e gestão</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Usuários Cadastrados</h2>
              <p className="text-xs text-slate-500">Configuração de WhatsApp, Metas e Menus Permitidos</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Carregando usuários da organização...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">Nenhum usuário encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
                    <th className="py-3.5 px-4 whitespace-nowrap">Usuário</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Nível</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Whats Comercial</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Permissões</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Meta</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Dias</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Meta/Dia</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const cleanPhone = u.whatsappNumber ? u.whatsappNumber.replace(/\D/g, "") : "";
                    const allowedList = typeof u.allowedMenus === "string"
                      ? u.allowedMenus.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
                      : ["metas", "kanban", "reports"];
                    const workingDays = u.workingDaysPerMonth || 22;
                    const dailyTarget = (u.monthlyTargetAmount || 0) / workingDays;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{u.name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                  login: {u.email.endsWith("@flowleads.com") ? u.email.replace("@flowleads.com", "") : u.email}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.role === "ADMIN" || u.role === "SUPERVISOR"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {u.role === "ADMIN" || u.role === "SUPERVISOR" ? "Supervisor" : "Vendedor"}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          {u.whatsappNumber ? (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium text-xs border border-emerald-200 transition-colors whitespace-nowrap"
                              title="WhatsApp para recebimento de leads da Meta Ads"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{u.whatsappNumber}</span>
                              <ExternalLink className="w-3 h-3 text-emerald-500 opacity-60" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                              Pendente vinculação
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          {/* Caixa com Dropdown de Permissões para evitar quebras de linha */}
                          <div className="relative inline-block">
                            <select
                              aria-label={`Permissões de ${u.name}`}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1 pr-6 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer whitespace-nowrap"
                              defaultValue="default"
                            >
                              <option value="default" disabled>
                                {allowedList.length} {allowedList.length === 1 ? "módulo" : "módulos"} permitidos ▾
                              </option>
                              {allowedList.map((m) => {
                                const label =
                                  m === "metas"
                                    ? "Gestão de Metas"
                                    : m === "kanban"
                                    ? "Kanban de Leads"
                                    : m === "reports"
                                    ? "Relatórios & Funil"
                                    : m === "cadastros"
                                    ? "Central de Cadastros"
                                    : m === "automations"
                                    ? "Automações No-Code"
                                    : m === "users"
                                    ? "Gestão de Usuários"
                                    : m;
                                return (
                                  <option key={m} value={m} disabled>
                                    ✓ {label}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                          {formatCurrency(u.monthlyTargetAmount || 0)}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {u.monthlyTargetDeals || 10} negócios
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold whitespace-nowrap">
                            {workingDays} dias
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right font-bold text-blue-600 whitespace-nowrap">
                          {formatCurrency(dailyTarget)}
                          <span className="block text-[10px] text-slate-400 font-normal">por dia útil</span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar Usuário / Metas"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {currentUser?.id !== u.id && (
                              <button
                                onClick={() => handleDelete(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Excluir Usuário"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Criação / Edição de Usuário */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {editingUser ? "Editar Usuário / Vendedor" : "Cadastrar Novo Usuário / Vendedor"}
                    </h3>
                    <p className="text-[11px] text-slate-500">Defina metas, WhatsApp da Meta Ads e acessos</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Linha 1: Nome e Usuário de Login */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Usuário de Login *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: carlos ou carlos@flowleads.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Nome usado para entrar no FlowLeads</span>
                  </div>
                </div>

                {/* Linha 2: Senha e Perfil */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {editingUser ? "Nova Senha (opcional)" : "Senha de Acesso *"}
                    </label>
                    <div className="relative">
                      <input
                        type={showModalPassword ? "text" : "password"}
                        required={!editingUser}
                        placeholder={editingUser ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowModalPassword(!showModalPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                        title={showModalPassword ? "Cobrir senha" : "Ver senha"}
                      >
                        {showModalPassword ? (
                          <EyeOff className="w-4 h-4 text-slate-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nível de Acesso (Cargo) *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option value="MEMBER">Vendedor / Consultor Comercial</option>
                      <option value="SUPERVISOR">Supervisor Comercial (Acesso Master)</option>
                    </select>
                  </div>
                </div>

                {/* Linha 3: WhatsApp Comercial para Meta Ads */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>WhatsApp Comercial (Meta Ads Leadgen) *</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Roteamento automático</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-8888"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: maskPhone(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Número vinculado à conta de anúncio da Meta. Leads que caírem neste WhatsApp serão inseridos diretamente no Kanban deste vendedor.
                  </p>
                </div>

                {/* Linha 4: Menus Permitidos */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Camadas de Acesso (Menus que o Usuário Pode Acessar)
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {AVAILABLE_MENUS.map((m) => {
                      const isChecked = formData.allowedMenus.includes(m.key);
                      return (
                        <div
                          key={m.key}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleMenuSelection(m.key)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleMenuSelection(m.key);
                            }
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                            isChecked
                              ? "bg-blue-50 border-blue-300 text-blue-900 font-semibold"
                              : "bg-white border-slate-200 text-slate-600"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-xs">{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Linha 5: Metas Comerciais e Dias Úteis */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Meta Mensal (R$)</label>
                    <input
                      type="number"
                      value={formData.monthlyTargetAmount}
                      onChange={(e) => setFormData({ ...formData, monthlyTargetAmount: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Meta Contratos (Deals)</label>
                    <input
                      type="number"
                      value={formData.monthlyTargetDeals}
                      onChange={(e) => setFormData({ ...formData, monthlyTargetDeals: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dias Úteis / Mês</label>
                    <input
                      type="number"
                      value={formData.workingDaysPerMonth}
                      onChange={(e) => setFormData({ ...formData, workingDaysPerMonth: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                {/* Linha 6: Jornada de Acesso */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Início Expediente</label>
                    <input
                      type="time"
                      value={formData.workStartTime}
                      onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fim Expediente</label>
                    <input
                      type="time"
                      value={formData.workEndTime}
                      onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Botões do Rodapé do Modal */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? "Salvando..." : editingUser ? "Salvar Alterações" : "Cadastrar Vendedor"}
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
