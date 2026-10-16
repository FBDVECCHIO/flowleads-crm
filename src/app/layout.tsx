import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowLeads CRM - Gestão de Leads e Processos",
  description: "Plataforma completa de gestão de leads, funil comercial e automações no-code inspirada no Pipefy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
