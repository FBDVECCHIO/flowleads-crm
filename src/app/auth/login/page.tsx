"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import WireTerrainScan from "@/components/ui/WireTerrainScan";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@flowleads.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao entrar");

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setTimeout(() => {
      handleLogin();
    }, 100);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 overflow-hidden bg-black select-none">
      {/* Fundo Animado Wire Terrain 4 — WebGL */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <WireTerrainScan />
      </div>

      {/* Card de Login com Efeito de Vidro e Alta Legibilidade */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/40 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/40">
            F
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">FlowLeads</h1>
            <p className="text-xs text-blue-600 font-medium">by Grupo Mário Neto</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Corporativo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Senha de Acesso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Acessar Plataforma"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Acesso Rápido para Demonstração:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickLogin("admin@flowleads.com", "admin123")}
              className="px-2 py-1.5 text-xs bg-slate-100/80 hover:bg-blue-50 hover:text-blue-600 font-medium rounded border border-slate-200 transition-colors"
            >
              Admin
            </button>
            <button
              onClick={() => quickLogin("carlos@flowleads.com", "user123")}
              className="px-2 py-1.5 text-xs bg-slate-100/80 hover:bg-blue-50 hover:text-blue-600 font-medium rounded border border-slate-200 transition-colors"
            >
              Carlos SDR
            </button>
            <button
              onClick={() => quickLogin("mariana@flowleads.com", "user123")}
              className="px-2 py-1.5 text-xs bg-slate-100/80 hover:bg-blue-50 hover:text-blue-600 font-medium rounded border border-slate-200 transition-colors"
            >
              Mariana Closer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}