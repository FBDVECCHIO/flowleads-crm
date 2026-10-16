import { authenticateUser } from "../../../../lib/auth.ts";

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

    const res = Response.json({ success: true, user });
    res.headers.set(
      "Set-Cookie",
      `flowleads_session=${encodeURIComponent(JSON.stringify(user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
    );
    return res;
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}