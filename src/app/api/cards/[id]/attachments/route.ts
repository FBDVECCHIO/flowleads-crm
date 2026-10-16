import { prisma } from "../../../../../lib/prisma.ts";
import { addCardAttachment } from "../../../../../services/cardService.ts";
import { requireAuth } from "../../../../../lib/auth.ts";

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
    return Response.json(attachments);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    // Optional auth check
    await requireAuth(req).catch(() => null);

    const body = await req.json();
    const { fileName, fileUrl, mimeType, sizeBytes } = body;

    if (!fileName || !fileUrl) {
      return Response.json({ error: "fileName e fileUrl são obrigatórios." }, { status: 400 });
    }

    const attachment = await addCardAttachment(resolvedParams.id, {
      fileName,
      fileUrl,
      mimeType: mimeType || "application/octet-stream",
      sizeBytes: Number(sizeBytes) || 0,
    });

    return Response.json(attachment, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
