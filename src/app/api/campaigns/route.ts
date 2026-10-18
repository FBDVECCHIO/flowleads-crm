import { prisma } from "../../../lib/prisma.ts";
import { persistDatabase, ensureDatabaseReady } from "../../../lib/dbSync.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET() {
  try {
    await ensureDatabaseReady();
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Calcular crosscheck: contagem de leads vinculados a cada campanha
    const campaignField = await prisma.field.findFirst({
      where: {
        OR: [
          { identifier: { contains: "campanha" } },
          { identifier: { contains: "campaign" } },
        ],
      },
    });

    const leadCountMap: Record<string, number> = {};
    if (campaignField) {
      const fieldValues = await prisma.cardFieldValue.findMany({
        where: { fieldId: campaignField.id },
        select: { value: true },
      });
      for (const fv of fieldValues) {
        const val = fv.value?.trim().toUpperCase();
        if (val) {
          leadCountMap[val] = (leadCountMap[val] || 0) + 1;
        }
      }
    }

    const campaignsWithCounts = campaigns.map((c) => {
      const normalizedName = c.name.trim().toUpperCase();
      const count = leadCountMap[normalizedName] || 0;
      return {
        ...c,
        leadCount: count,
      };
    });

    return Response.json(campaignsWithCounts, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return Response.json({ error: "Nome da campanha é obrigatório." }, { status: 400, headers: noStoreHeaders });
    }

    const org = await prisma.organization.findFirst();
    if (!org) return Response.json({ error: "Organização não encontrada." }, { status: 400, headers: noStoreHeaders });

    const campaign = await prisma.campaign.create({
      data: {
        organizationId: org.id,
        name: body.name.trim().toUpperCase(),
        description: body.description?.trim() ? body.description.trim().toUpperCase() : null,
        imageUrl: body.imageUrl?.trim() || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        products: body.products ? (typeof body.products === "string" ? body.products.toUpperCase() : JSON.stringify(body.products)) : null,
        eligibleStores: body.eligibleStores ? (typeof body.eligibleStores === "string" ? body.eligibleStores : JSON.stringify(body.eligibleStores)) : null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    await persistDatabase();
    return Response.json(campaign, { status: 201, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}


