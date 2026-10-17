import { getDefaultUser, verifySession } from "../../../../lib/auth.ts";
import { prisma } from "../../../../lib/prisma.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    let token: string | null = null;
    const match = cookieHeader.match(/flowleads_session=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    } else {
      const authHeader = req.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (token) {
      const userAgent = req.headers.get("user-agent") || undefined;
      const session = verifySession(token, userAgent);
      if (session) {
        const user = await prisma.user.findUnique({
          where: { id: session.userId },
        });
        if (user) {
          return Response.json({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              organizationId: user.organizationId,
              whatsappNumber: user.whatsappNumber,
              monthlyTargetAmount: user.monthlyTargetAmount,
              monthlyTargetDeals: user.monthlyTargetDeals,
              workingDaysPerMonth: user.workingDaysPerMonth,
              allowedMenus: user.allowedMenus,
              allowedDays: user.allowedDays,
              workStartTime: user.workStartTime,
              workEndTime: user.workEndTime,
            },
          }, { status: 200, headers: noStoreHeaders });
        }
      }
    }

    const user = await getDefaultUser();
    return Response.json({ user }, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}