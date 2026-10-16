import { prisma } from "../lib/prisma.ts";

export class PipeService {
  static async listPipes(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};
    return prisma.pipe.findMany({
      where,
      include: {
        phases: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, color: true, order: true },
        },
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async getPipeById(pipeId: string) {
    return prisma.pipe.findUnique({
      where: { id: pipeId },
      include: {
        phases: {
          orderBy: { order: "asc" },
          include: {
            fields: { orderBy: { order: "asc" } },
          },
        },
        fields: {
          orderBy: { order: "asc" },
        },
        labels: true,
        automations: {
          orderBy: { createdAt: "desc" },
        },
        webhooks: true,
      },
    });
  }

  static async getPublicFormBySlug(slug: string) {
    const pipe = await prisma.pipe.findUnique({
      where: { publicFormSlug: slug, isPublicFormEnabled: true },
      include: {
        fields: {
          where: { phaseId: null }, // Start Form fields
          orderBy: { order: "asc" },
        },
        phases: {
          orderBy: { order: "asc" },
          take: 1, // Primeira fase (Inbox)
        },
      },
    });
    return pipe;
  }
}