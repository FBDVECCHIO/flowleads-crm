"use client";

import { useEffect, useState, use } from "react";
import { CheckCircle2, AlertCircle, Send, Sparkles } from "lucide-react";

export default function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public-form/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Formulário não encontrado");
        return res.json();
      })
      .then((data) => {
        setFormConfig(data);
        const initial: Record<string, string> = {};
        for (const f of data.fields) {
          initial[f.identifier] = "";
        }
        setFormValues(initial);
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleChange = (id: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/public-form/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldValues: formValues }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar formulário.");

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-400">
        Carregando formulário de atendimento...
      </div>
    );
  }

  if (errorMsg && !formConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-red-200 text-center max-w-sm">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h2 className="text-sm font-bold text-slate-800">Formulário Indisponível</h2>
          <p className="text-xs text-slate-500 mt-1">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Solicitação Enviada com Sucesso!</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Seus dados foram recebidos pela nossa equipe comercial. Em instantes nosso especialista entrará em contato com você.
          </p>
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setSubmitted(false);
                setFormValues({});
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Enviar outra solicitação
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner do Formulário com a cor do Pipe */}
        <div
          className="p-6 text-white"
          style={{ backgroundColor: formConfig.color || "#0b66c3" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-xs font-bold">
              F
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-100">
              Formulário Oficial de Entrada
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{formConfig.pipeName}</h1>
          <p className="text-xs text-blue-100 mt-1">{formConfig.description}</p>
        </div>

        {errorMsg && (
          <div className="m-6 mb-0 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formConfig.fields.map((field: any) => (
            <div key={field.id} className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                {field.label} {field.isRequired && <span className="text-red-500">*</span>}
              </label>

              {field.type === "TEXTAREA" ? (
                <textarea
                  required={field.isRequired}
                  rows={3}
                  value={formValues[field.identifier] || ""}
                  onChange={(e) => handleChange(field.identifier, e.target.value)}
                  placeholder={field.placeholder || ""}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : field.type === "SELECT" ? (
                <select
                  required={field.isRequired}
                  value={formValues[field.identifier] || ""}
                  onChange={(e) => handleChange(field.identifier, e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Selecione uma opção...</option>
                  {JSON.parse(field.options || "[]").map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required={field.isRequired}
                  type={field.type === "EMAIL" ? "email" : field.type === "NUMBER" ? "number" : "text"}
                  value={formValues[field.identifier] || ""}
                  onChange={(e) => handleChange(field.identifier, e.target.value)}
                  placeholder={field.placeholder || ""}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Protegido por FlowLeads CRM</span>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Enviando..." : "Enviar Informações"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
