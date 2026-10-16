"use client";

import { Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export function TableView({ cards, onOpenCard }: { cards: any[]; onOpenCard: (card: any) => void }) {
  const exportToCSV = () => {
    const headers = ["ID", "Título", "Fase", "Valor", "Prioridade", "Criado Em"];
    const rows = cards.map((c) => [
      c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.currentPhase?.name || ""}"`,
      c.dealValue || 0,
      c.priority || "",
      c.createdAt,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <span className="text-xs font-bold text-slate-800">{cards.length} Leads listados</span>
        <button
          onClick={exportToCSV}
          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Exportar CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="p-3">Título do Lead</th>
              <th className="p-3">Fase Atual</th>
              <th className="p-3">Valor Estimado</th>
              <th className="p-3">Prioridade</th>
              <th className="p-3">Data de Entrada</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {cards.map((card) => (
              <tr key={card.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-semibold">{card.title}</td>
                <td className="p-3">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: card.currentPhase?.color || "#3b82f6" }}
                  >
                    {card.currentPhase?.name}
                  </span>
                </td>
                <td className="p-3 font-semibold text-emerald-700">{formatCurrency(card.dealValue)}</td>
                <td className="p-3">{card.priority}</td>
                <td className="p-3 text-slate-500">{formatDate(card.createdAt)}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => onOpenCard(card)}
                    className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded font-semibold text-[11px] transition-colors"
                  >
                    Ver Lead
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
