export async function POST() {
  const res = Response.json({ success: true, message: "Sessão encerrada com sucesso." });
  res.headers.set(
    "Set-Cookie",
    "flowleads_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );
  return res;
}

export async function GET() {
  return POST();
}

