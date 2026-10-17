"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Database, Plus, Table, Building2, Phone, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DatabasePage() {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [segment, setSegment] = useState("Tecnologia");

  const fetchTables = async () => {
    try {
      const res = await fetch(`/api/database?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setTables(data);
      if (data.length > 0) {
        setSelectedTable(data[0]);
        loadRecords(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (tableId: string) => {
    const res = await fetch(`/api/database/${tableId}/records?_t=${Date.now()}`, { cache: "no-store" });
    const data = await res.json();
    setRecords(data);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedTable) return;

    await fetch(`/api/database/${selectedTable.id}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        values: { cnpj, segment },
      }),
    });

    setTitle("");
    setCnpj("");
    setIsModalOpen(false);
    loadRecords(selectedTable.id);
  };

  return (
    <AppShell userName="Gestor Comercial">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Database Central de Clientes</h1>
            </div>
            <p className="text-xs text-slate-500">
              Bancos de dados relacionais estruturados para suporte aos processos comerciais.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro</span>
          </button>
        </div>

        {selectedTable && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-900">{selectedTable.name}</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {records.length} empresas cadastradas
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3">Nome da Empresa</th>
                    <th className="p-3">CNPJ</th>
                    <th className="p-3">Segmento</th>
                    <th className="p-3">Data de Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {records.map((rec) => {
                    const vals = JSON.parse(rec.values || "{}");
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">{rec.title}</td>
                        <td className="p-3 font-mono text-slate-600">{vals.cnpj || "-"}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                            {vals.segment || "Geral"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{formatDate(rec.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Cadastrar Nova Empresa / Cliente</h3>
              <p className="text-xs text-slate-500 mb-4">Adicione uma empresa à base relacional de clientes.</p>

              <form onSubmit={handleCreateRecord} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Razão Social / Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nexus Soluções Digitais Ltda"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Segmento</label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Tecnologia">Tecnologia</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Varejo">Varejo</option>
                    <option value="Logística">Logística</option>
                    <option value="Serviços">Serviços</option>
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
                    Cadastrar
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
