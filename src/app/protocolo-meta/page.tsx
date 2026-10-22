"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Printer, Download, Copy, Check, ExternalLink, ShieldCheck, ArrowLeft } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function ProtocoloMetaPage() {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const copyToClipboard = (text: string, type: "url" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <AppShell
      pipeId="default"
      userName="Carlos Silva"
      userRole="SUPERVISOR"
      orgName="Grupo Mário Neto"
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        {/* Top Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <Link
              href="/cadastros"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Voltar aos Cadastros"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Protocolo Executivo de Integração Meta Ads
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-extrabold uppercase tracking-wider">
                  Oficial v2.4
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Diretrizes de engenharia para ingestão em tempo real de leads do Instagram e Facebook Ads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar em PDF</span>
            </button>
            <a
              href="/Protocolo-Integracao-Meta-FlowLeads.pdf"
              target="_blank"
              download="Protocolo-Integracao-Meta-FlowLeads.pdf"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PDF Oficial</span>
            </a>
          </div>
        </div>

        {/* Quick Config Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              FLOWLEADS_WEBHOOK_URL (Cloudflare Worker)
            </span>
            <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
              <code className="text-xs font-mono text-slate-800 truncate select-all">
                https://flowleads-crm-blush.vercel.app/api/webhooks/inbound
              </code>
              <button
                onClick={() => copyToClipboard("https://flowleads-crm-blush.vercel.app/api/webhooks/inbound", "url")}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                title="Copiar URL"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Meta Callback URL (Direto)</span>
            <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
              <code className="text-xs font-mono text-slate-800 truncate select-all">
                https://flowleads-crm-blush.vercel.app/api/webhooks/meta
              </code>
              <button
                onClick={() => copyToClipboard("https://flowleads-crm-blush.vercel.app/api/webhooks/meta", "url")}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                title="Copiar URL Meta"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Token de Verificação</span>
            <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
              <code className="text-xs font-mono text-slate-800 select-all font-bold">
                flowleads_verify_token
              </code>
              <button
                onClick={() => copyToClipboard("flowleads_verify_token", "token")}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
                title="Copiar Token"
              >
                {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Protocol Document Body */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8 text-slate-800">
          <div className="border-b border-slate-200 pb-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-md">
                Grupo Mário Neto • FlowLeads CRM
              </span>
              <span className="text-xs text-slate-400 font-mono">Ref: DOC-FL-META-2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Protocolo Técnico de Integração Meta Ads & Instagram
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Arquitetura de Webhooks em tempo real, roteamento omnichannel de leads para lojas e vendedores, verificação HMAC-SHA256 e conformidade com a LGPD.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
              Visão Geral e Mapeamento da Hierarquia Meta Ads
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              O FlowLeads CRM implementa um endpoint de alta performance e resiliência (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">/api/webhooks/meta</code>) conectado à infraestrutura global da Meta (Facebook e Instagram). O lead gerado nos anúncios Instantâneos (Lead Ads) ou por clique no WhatsApp é capturado em menos de 1 segundo, gerando um card na coluna <strong>NOVO LEAD</strong> do vendedor correspondente.
            </p>

            {/* Hierarquia Visual */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Mapeamento da Estrutura de Tráfego:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Conta de Anúncios</span>
                  <span className="font-bold text-slate-800 text-xs">Grupo Mário Neto</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-blue-500 font-bold block uppercase">Ciclo / Campanha</span>
                  <span className="font-bold text-slate-800 text-xs">Campanha de Vendas</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-indigo-500 font-bold block uppercase">Grupo de Anúncios</span>
                  <span className="font-bold text-slate-800 text-xs">Público / Loja</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-emerald-500 font-bold block uppercase">Anúncio / Criativo</span>
                  <span className="font-bold text-slate-800 text-xs">Card "NOVO LEAD"</span>
                </div>
              </div>
            </div>

            {/* Tabela de Dados Extraídos */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 border-b border-slate-200">Dado Capturado</th>
                    <th className="p-2.5 border-b border-slate-200">Origem Meta Ads</th>
                    <th className="p-2.5 border-b border-slate-200">Destino no FlowLeads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Nome do Cliente</td>
                    <td className="p-2.5 font-mono text-[11px]">full_name</td>
                    <td className="p-2.5">Título do Card em UPPERCASE</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Telefone / WhatsApp</td>
                    <td className="p-2.5 font-mono text-[11px]">phone_number</td>
                    <td className="p-2.5">Telefone formatado com botão direto wa.me</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Ciclo / Campanha</td>
                    <td className="p-2.5 font-mono text-[11px]">campaign_name</td>
                    <td className="p-2.5">Campo Campanha e Tag visual no card</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Grupo de Anúncios</td>
                    <td className="p-2.5 font-mono text-[11px]">adset_name</td>
                    <td className="p-2.5">Comentário interno de auditoria de tráfego</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Anúncio / Criativo</td>
                    <td className="p-2.5 font-mono text-[11px]">ad_name / ad_id</td>
                    <td className="p-2.5">Comentário interno e rastreio de criativo</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-800">Canal de Origem</td>
                    <td className="p-2.5 font-mono text-[11px]">platform (fb / ig)</td>
                    <td className="p-2.5">Identificação Instagram vs Facebook</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              Configuração no Meta for Developers
            </h2>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p><strong>1. Acessar o Portal:</strong> Entre em <a href="https://developers.facebook.com" target="_blank" className="text-blue-600 underline">developers.facebook.com</a> com o perfil administrador da Business Manager do Grupo Mário Neto.</p>
              <p><strong>2. Criar ou Selecionar App:</strong> Selecione o tipo de aplicativo "Empresa / Business" nomeado como <em>FlowLeads CRM</em>.</p>
              <p><strong>3. Configurar Webhooks:</strong> No menu lateral, adicione o produto <em>Webhooks</em> e selecione o objeto <strong>Page</strong>.</p>
              <p><strong>4. Callback URL:</strong> Informe <code className="bg-slate-100 px-1 py-0.5 rounded">https://flowleads-crm-blush.vercel.app/api/webhooks/meta</code>.</p>
              <p><strong>5. Verify Token:</strong> Informe <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">flowleads_verify_token</code>.</p>
              <p><strong>6. Assinar Evento:</strong> Ative a subscrição para o campo <strong>leadgen</strong>.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              Roteamento Inteligente por WhatsApp (Vendedores & Lojas)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              No menu <strong>Usuários</strong> do FlowLeads, cada consultor de vendas tem seu número de WhatsApp comercial configurado com a máscara com DDD <code className="bg-slate-100 px-1 py-0.5 rounded">(XX) XXXXX-XXXX</code>. O motor do FlowLeads correlaciona automaticamente o destino do anúncio da Meta com o WhatsApp do vendedor, alocando o lead de forma direta e exclusiva em seu painel Kanban individual.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</span>
              Governança Imutável do Kanban e Validações Óticas
            </h2>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>• <strong>3 Colunas Imutáveis:</strong> As fases <em>NOVO LEAD</em>, <em>FECHADO</em> e <em>PERDIDO</em> não podem ser renomeadas nem excluídas para assegurar a consistência dos relatórios de conversão.</p>
              <p>• <strong>Obrigatoriedade de Agendamento:</strong> Nenhum lead consegue sair de <em>NOVO LEAD</em> para as etapas seguintes sem o preenchimento prévio da <em>Loja Negociada</em> e da <em>Data/Hora Estimada da Visita</em> à ótica.</p>
              <p>• <strong>Campos de Fechamento Travados:</strong> Número da OS, Valor Final da Venda, Vendedor e Data da Venda permanecem bloqueados e só são liberados para preenchimento quando o card é movido para o status <em>FECHADO</em>.</p>
              <p>• <strong>Padronização UPPERCASE:</strong> Todos os textos digitados no sistema são gravados e demonstrados em letras maiúsculas para uniformidade visual e relatórios corporativos.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">5</span>
              Simulação de Disparo com a Lead Ads Testing Tool
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Para validar o funcionamento sem custos, acesse <a href="https://developers.facebook.com/tools/lead-ads-testing" target="_blank" className="text-blue-600 underline">facebook.com/tools/lead-ads-testing</a>, selecione sua Página e Formulário e clique em <strong>Criar Cadastro</strong>. Em seguida, acerte o Kanban no FlowLeads: o card surgirá imediatamente na coluna <strong>NOVO LEAD</strong> com o botão de contato do WhatsApp e a etiqueta da Campanha.
            </p>
          </section>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Validação Criptográfica HMAC-SHA256 • Conformidade LGPD</span>
            </div>
            <span>Grupo Mário Neto • FlowLeads CRM</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
