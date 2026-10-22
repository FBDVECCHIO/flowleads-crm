import { NextResponse } from "next/server";
import { processMetaLead } from "../../../../services/metaLeadService";

const WEBHOOK_SECRET = process.env.FLOWLEADS_WEBHOOK_SECRET || process.env.META_VERIFY_TOKEN;

/**
 * GET: Webhook verification / health check
 * Compatível com o handshake de verificação da Meta e probes de monitoramento.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge) {
    if (token && WEBHOOK_SECRET && token !== WEBHOOK_SECRET && token !== "flowleads_verify_token") {
      return new Response("Verification token mismatch", { status: 403 });
    }
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({
    status: "active",
    service: "FlowLeads CRM Inbound Webhook",
    message: "Endpoint operacional pronto para receber leads via Cloudflare Workers e Meta Ads.",
    endpoints: {
      inbound: "/api/webhooks/inbound",
      v1_inbound: "/api/v1/webhook/inbound",
    },
    version: "2.0",
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST: Ingest lead from Cloudflare Worker or Meta Ads payload
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (!rawBody || rawBody.trim() === "") {
      return NextResponse.json(
        { error: "Payload vazio recebido." },
        { status: 400 }
      );
    }

    // Validação opcional de token/segredo se FLOWLEADS_WEBHOOK_SECRET estiver configurado
    if (process.env.FLOWLEADS_WEBHOOK_SECRET) {
      const headerSecret =
        req.headers.get("x-webhook-secret") ||
        req.headers.get("x-webhook-token") ||
        req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        new URL(req.url).searchParams.get("token") ||
        new URL(req.url).searchParams.get("secret");

      if (headerSecret !== process.env.FLOWLEADS_WEBHOOK_SECRET) {
        return NextResponse.json(
          { error: "Acesso não autorizado: token de autenticação de webhook inválido." },
          { status: 401 }
        );
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Formato de payload inválido. JSON esperado." },
        { status: 400 }
      );
    }

    // Suporte amplo a variações de campos comuns enviados por Workers ou Webhooks
    const name =
      payload.name ||
      payload.full_name ||
      payload.nome ||
      payload.lead_name ||
      payload.customer_name ||
      payload.client_name ||
      payload.lead?.name ||
      payload.lead?.full_name ||
      "Lead Sem Nome";

    const phone =
      payload.phone ||
      payload.phone_number ||
      payload.whatsapp ||
      payload.tel ||
      payload.celular ||
      payload.telefone ||
      payload.lead?.phone ||
      payload.lead?.phone_number ||
      "";

    const destination_whatsapp =
      payload.destination_whatsapp ||
      payload.seller_whatsapp ||
      payload.vendedor_whatsapp ||
      payload.target_phone ||
      payload.store_phone ||
      payload.to ||
      payload.lead?.destination_whatsapp ||
      payload.metadata?.display_phone_number ||
      undefined;

    const email = payload.email || payload.mail || payload.lead?.email || undefined;

    const campaign_name =
      payload.campaign_name ||
      payload.campaign ||
      payload.campanha ||
      payload.campaign_id ||
      payload.marketing?.campaign_name ||
      payload.marketing?.headline ||
      undefined;

    const adset_name =
      payload.adset_name ||
      payload.adset ||
      payload.grupo ||
      payload.adset_id ||
      payload.marketing?.adset_name ||
      undefined;

    const ad_name =
      payload.ad_name ||
      payload.ad ||
      payload.anuncio ||
      payload.criativo ||
      payload.ad_id ||
      payload.marketing?.ad_name ||
      payload.marketing?.headline ||
      undefined;

    const dealValue =
      payload.dealValue !== undefined
        ? Number(payload.dealValue)
        : payload.value !== undefined
        ? Number(payload.value)
        : payload.valor !== undefined
        ? Number(payload.valor)
        : 0;

    const platform =
      payload.platform ||
      payload.channel ||
      payload.canal ||
      "META ADS / CLOUDFLARE WORKER";

    const form_name = payload.form_name || payload.form || undefined;
    const form_id = payload.form_id || undefined;
    const leadgen_id =
      payload.leadgen_id ||
      payload.id ||
      `ctwa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Caso: Repasse de evento nativo da Meta ({ entry: [...] })
    if (payload.entry && Array.isArray(payload.entry)) {
      const results: any[] = [];
      for (const entry of payload.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const val = change.value;
            if (val) {
              const res = await processMetaLead(val.leadgen_id || leadgen_id, undefined, {
                name: val.lead_data?.name || val.lead_data?.full_name,
                phone: val.lead_data?.phone || val.lead_data?.phone_number,
                email: val.lead_data?.email,
                dealValue: val.lead_data?.dealValue,
                destination_whatsapp: val.destination_whatsapp || destination_whatsapp,
                campaign_id: val.campaign_id,
                campaign_name: val.campaign_name,
                adset_id: val.adset_id,
                adset_name: val.adset_name,
                ad_id: val.ad_id,
                ad_name: val.ad_name,
                form_id: val.form_id,
                form_name: val.form_name,
                platform: val.platform || "META ADS",
                ...val.lead_data,
              });
              results.push(res);
            }
          }
        }
      }
      return NextResponse.json({
        success: true,
        message: "Leads nativos da Meta processados com sucesso.",
        processed: results,
      });
    }

    // Processamento do lead padrão
    const result = await processMetaLead(leadgen_id, payload.pipeId, {
      name,
      phone,
      email,
      dealValue,
      destination_whatsapp,
      campaign_name,
      adset_name,
      ad_name,
      form_name,
      form_id,
      platform,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead recebido e cadastrado com sucesso no FlowLeads CRM.",
        cardId: result.cardId,
        assignedToUserId: result.assignedToUserId,
        lead: {
          name,
          phone,
          destination_whatsapp: destination_whatsapp || null,
          campaign_name: campaign_name || null,
          dealValue,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[INBOUND_WEBHOOK_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro interno no processamento do webhook.",
      },
      { status: 500 }
    );
  }
}
