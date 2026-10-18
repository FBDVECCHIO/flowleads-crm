"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Sparkles, Eye, Undo2 } from "lucide-react";

interface LiquidGlassContextType {
  isLiquidGlass: boolean;
  toggleLiquidGlass: () => void;
  setLiquidGlass: (enabled: boolean) => void;
}

const LiquidGlassContext = createContext<LiquidGlassContextType>({
  isLiquidGlass: true,
  toggleLiquidGlass: () => {},
  setLiquidGlass: () => {},
});

export function LiquidGlassProvider({ children }: { children: React.ReactNode }) {
  const [isLiquidGlass, setIsLiquidGlassState] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("flowleads_liquid_glass");
    if (saved !== null) {
      const active = saved === "true";
      setIsLiquidGlassState(active);
      applyTheme(active);
    } else {
      applyTheme(true);
    }

    // Dynamic glint cursor tracking
    const handlePointerMove = (e: PointerEvent) => {
      const cards = document.querySelectorAll(".liquid-glass-card");
      cards.forEach((card) => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        if (
          e.clientX >= rect.left - 50 &&
          e.clientX <= rect.right + 50 &&
          e.clientY >= rect.top - 50 &&
          e.clientY <= rect.bottom + 50
        ) {
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          (card as HTMLElement).style.setProperty("--gx", `${x.toFixed(1)}%`);
          (card as HTMLElement).style.setProperty("--gy", `${y.toFixed(1)}%`);
        }
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  const applyTheme = (enabled: boolean) => {
    if (typeof document !== "undefined") {
      if (enabled) {
        document.documentElement.setAttribute("data-liquid-glass", "true");
      } else {
        document.documentElement.removeAttribute("data-liquid-glass");
      }
    }
  };

  const setLiquidGlass = (enabled: boolean) => {
    setIsLiquidGlassState(enabled);
    try {
      localStorage.setItem("flowleads_liquid_glass", String(enabled));
    } catch {}
    applyTheme(enabled);
  };

  const toggleLiquidGlass = () => {
    setLiquidGlass(!isLiquidGlass);
  };

  return (
    <LiquidGlassContext.Provider value={{ isLiquidGlass, toggleLiquidGlass, setLiquidGlass }}>
      {children}
    </LiquidGlassContext.Provider>
  );
}

export function useLiquidGlass() {
  return useContext(LiquidGlassContext);
}

/**
 * Luxury toggle button to switch between Liquid Glass Cookbook and Classic design.
 * Gives the user 1-click instant preview and 1-click instant rollback directly in the UI!
 */
export function LiquidGlassToggle({ className = "" }: { className?: string }) {
  const { isLiquidGlass, toggleLiquidGlass } = useLiquidGlass();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggleLiquidGlass}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none shadow-sm border ${
        isLiquidGlass
          ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white border-white/30 backdrop-blur-md shadow-blue-500/25 hover:shadow-blue-500/40"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      } ${className}`}
      title={isLiquidGlass ? "Clique para voltar ao visual Clássico" : "Clique para ativar o visual Liquid Glass"}
    >
      <Sparkles className={`w-3.5 h-3.5 ${isLiquidGlass ? "text-amber-300 animate-pulse" : "text-slate-400"}`} />
      <span>{isLiquidGlass ? "Liquid Glass: Ativo" : "Estilo: Clássico"}</span>
      <span className="text-[10px] opacity-75 underline ml-1">
        {isLiquidGlass ? "(Voltar)" : "(Ativar)"}
      </span>
    </button>
  );
}
