import { 
  authenticateUser, 
  checkScheduleAccess, 
  signSession, 
  computeUserAgentFingerprint 
} from "../../../../lib/auth.ts";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    // Controle de Jornada de Trabalho (Seg-Sex 08:00 às 18:00 America/Sao_Paulo)
    const scheduleCheck = checkScheduleAccess(user);
    if (!scheduleCheck.allowed) {
      return Response.json(
        {
          error: scheduleCheck.reason || "Acesso fora da jornada de trabalho autorizada (Seg-Sex 08:00 às 18:00). Contate seu supervisor.",
          code: "OUTSIDE_WORK_HOURS",
          allowedWindow: {
            days: "Segunda a Sexta-feira",
            hours: `${user.workStartTime || "08:00"} às ${user.workEndTime || "18:00"}`,
          },
        },
        { status: 403 }
      );
    }

    const userAgent = req.headers.get("user-agent") || "";
    const sessionToken = signSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      organizationId: user.organizationId,
      fingerprint: computeUserAgentFingerprint(userAgent),
      issuedAt: Date.now(),
    });

    const res = Response.json({ success: true, user, token: sessionToken });
    res.headers.set(
      "Set-Cookie",
      `flowleads_session=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    );
    return res;
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}