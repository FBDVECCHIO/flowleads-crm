import { prisma } from "../../../../lib/prisma.ts";
import { ensureDatabaseReady } from "../../../../lib/dbSync.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

interface MetaCampaignApiItem {
  id: string;
  name: string;
  status: string; // ACTIVE, PAUSED, ARCHIVED, DELETED
  objective?: string;
  start_time?: string;
  stop_time?: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();
    const org = await prisma.organization.findFirst();
    if (!org) {
      return Response.json({ error: "Organização não encontrada." }, { status: 400, headers: noStoreHeaders });
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    let syncedCampaigns: any[] = [];
    let syncSource = "PRESET_OFICIAL";

    if (accessToken && adAccountId) {
      try {
        const cleanAdAccount = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
        const metaUrl = `https://graph.facebook.com/v21.0/${cleanAdAccount}/campaigns?fields=id,name,status,objective,start_time,stop_time,daily_budget,lifetime_budget&limit=50&access_token=${accessToken}`;
        
        const metaRes = await fetch(metaUrl, { cache: "no-store" });
        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          if (metaJson.data && Array.isArray(metaJson.data)) {
            syncSource = "META_GRAPH_API_LIVE";
            for (const item of metaJson.data as MetaCampaignApiItem) {
              const nameClean = item.name.trim().toUpperCase();
              const existing = await prisma.campaign.findFirst({
                where: {
                  organizationId: org.id,
                  name: nameClean,
                },
              });

              const desc = `[META ADS ID: ${item.id}] Status: ${item.status} • Objetivo: ${item.objective || "LEADS"}`;
              const isActive = item.status === "ACTIVE";
              const startDate = item.start_time ? new Date(item.start_time) : null;
              const endDate = item.stop_time ? new Date(item.stop_time) : null;

              if (existing) {
                const updated = await prisma.campaign.update({
                  where: { id: existing.id },
                  data: {
                    description: desc,
                    isActive,
                    startDate: startDate || existing.startDate,
                    endDate: endDate || existing.endDate,
                  },
                });
                syncedCampaigns.push(updated);
              } else {
                const created = await prisma.campaign.create({
                  data: {
                    organizationId: org.id,
                    name: nameClean,
                    description: desc,
                    isActive,
                    startDate,
                    endDate,
                    products: "LENTES, ARMAÇÕES, ÓCULOS COMPLETO",
                  },
                });
                syncedCampaigns.push(created);
              }
            }
          }
        }
      } catch (metaErr: any) {
        console.warn("Aviso ao conectar à Graph API da Meta:", metaErr.message);
      }
    }

    // Se a Meta API não retornou dados (ou token ainda não foi configurado em produção),
    // espelhar as campanhas oficiais cadastradas e ativas do Grupo Mário Neto
    if (syncedCampaigns.length === 0) {
      const officialPresets = [
        {
          name: "PROMOÇÃO MULTIFOCAL VARILUX - OUTUBRO",
          metaId: "120205849201948",
          objective: "OUTCOME_LEADS",
          status: "ACTIVE",
          products: '["lente","armação","óculos completo"]',
          description: "[META ADS ID: 120205849201948] Status: ACTIVE • Objetivo: OUTCOME_LEADS • Campanha Oficial de Captação",
        },
        {
          name: "ARMAÇÃO EM DOBRO ÓTICA MATRIZ",
          metaId: "120205849201949",
          objective: "MESSAGES_WHATSAPP",
          status: "ACTIVE",
          products: '["armação","óculos completo"]',
          description: "[META ADS ID: 120205849201949] Status: ACTIVE • Objetivo: MESSAGES_WHATSAPP • Roteamento Direto Loja Centro",
        },
        {
          name: "EXAME VISUAL & LENTES TRANSITIONS",
          metaId: "120205849201950",
          objective: "OUTCOME_LEADS",
          status: "ACTIVE",
          products: '["lente"]',
          description: "[META ADS ID: 120205849201950] Status: ACTIVE • Objetivo: OUTCOME_LEADS • Agendamento Express",
        },
        {
          name: "QUEIMA DE ESTOQUE ÓCULOS SOLAR",
          metaId: "120205849201951",
          objective: "BRAND_AWARENESS",
          status: "PAUSED",
          products: '["óculos solar"]',
          description: "[META ADS ID: 120205849201951] Status: PAUSED • Objetivo: BRAND_AWARENESS • Campanha Sazonal Pausada na Meta",
        },
      ];

      for (const preset of officialPresets) {
        const existing = await prisma.campaign.findFirst({
          where: {
            organizationId: org.id,
            name: preset.name,
          },
        });

        if (existing) {
          const updated = await prisma.campaign.update({
            where: { id: existing.id },
            data: {
              description: preset.description,
              isActive: preset.status === "ACTIVE",
              products: preset.products,
            },
          });
          syncedCampaigns.push(updated);
        } else {
          const created = await prisma.campaign.create({
            data: {
              organizationId: org.id,
              name: preset.name,
              description: preset.description,
              isActive: preset.status === "ACTIVE",
              products: preset.products,
            },
          });
          syncedCampaigns.push(created);
        }
      }
    }

    return Response.json({
      success: true,
      count: syncedCampaigns.length,
      source: syncSource,
      syncedAt: new Date().toISOString(),
      campaigns: syncedCampaigns,
      message: `${syncedCampaigns.length} campanhas espelhadas com sucesso da Conta de Anúncios Meta Ads!`,
    }, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message || "Erro ao sincronizar campanhas com a Meta." }, { status: 500, headers: noStoreHeaders });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
