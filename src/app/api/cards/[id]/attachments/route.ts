import { prisma } from "../../../../../lib/prisma.ts";
import { addCardAttachment } from "../../../../../services/cardService.ts";
import { requireAuth } from "../../../../../lib/auth.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const attachments = await prisma.cardAttachment.findMany({
      where: { cardId: resolvedParams.id },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(attachments, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    await requireAuth(req).catch(() => null);

    const body = await req.json();
    const { fileName, fileUrl, mimeType, sizeBytes } = body;

    if (!fileName || !fileUrl) {
      return Response.json({ error: "fileName e fileUrl são obrigatórios." }, { status: 400, headers: noStoreHeaders });
    }

    const attachment = await addCardAttachment(resolvedParams.id, {
      fileName,
      fileUrl,
      mimeType: mimeType || "application/octet-stream",
      sizeBytes: Number(sizeBytes) || 0,
    });

    return Response.json(attachment, { status: 201, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}
