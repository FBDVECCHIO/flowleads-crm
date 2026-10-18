import type { Metadata } from "next";
import "./globals.css";
import { LiquidGlassProvider } from "@/components/theme/LiquidGlassContext";

export const metadata: Metadata = {
  title: "FlowLeads by Grupo Mário Neto - Gestão de Leads e Processos Comerciais",
  description: "Plataforma comercial e gestão de leads FlowLeads by Grupo Mário Neto.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <LiquidGlassProvider>
          {children}
        </LiquidGlassProvider>
      </body>
    </html>
  );
}
