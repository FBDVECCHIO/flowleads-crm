import { verifyMetaSignature, processMetaLead } from "../../../../services/metaLeadService.ts";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "flowleads_verify_token";

/**
 * GET: Webhook verification handshake (hub.challenge)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (!mode || mode !== "subscribe") {
    return new Response("Invalid mode", { status: 403 });
  }

  if (!challenge) {
    return new Response("Missing challenge", { status: 400 });
  }

  if (token !== VERIFY_TOKEN) {
    return new Response("Verification token mismatch", { status: 403 });
  }

  return new Response(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * POST: Inbound Meta Ads leadgen webhook event
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signatureHeader =
      req.headers.get("x-hub-signature-256") || req.headers.get("x-hub-signature") || "";

    const isValid = verifyMetaSignature(rawBody, signatureHeader);
    if (!isValid) {
      return Response.json(
        { error: "Assinatura do webhook da Meta inválida (HMAC-SHA256 mismatch)." },
        { status: 403 }
      );
    }

    const payload = JSON.parse(rawBody);
    const results: any[] = [];

    if (payload.entry && Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const val = change.value;
            if (val && val.leadgen_id) {
              const res = await processMetaLead(val.leadgen_id, undefined, {
                destination_whatsapp: val.destination_whatsapp,
                campaign_id: val.campaign_id,
                ...val.lead_data,
              });
              results.push(res);
            }
          }
        }
      }
    }

    return Response.json({ success: true, processed: results }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message || "Erro no processamento do webhook" }, { status: 500 });
  }
}
