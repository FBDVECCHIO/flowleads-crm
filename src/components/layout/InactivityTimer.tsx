"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

export function InactivityTimer() {
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Não ativa timer se o usuário já estiver na tela de login
    if (pathname?.startsWith("/auth/login")) return;

    const performLogout = async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (err) {
        // Silencioso
      }
      document.cookie = "flowleads_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      window.location.href = "/auth/login?reason=inactivity";
    };

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(performLogout, INACTIVITY_TIMEOUT_MS);
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    
    // Inicia o timer
    resetTimer();

    // Registra listeners de atividade global
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [pathname]);

  // Sem demonstrar nada visual na tela
  return null;
}

