import { getDefaultUser } from "../../../../lib/auth.ts";

export async function GET(req: Request) {
  try {
    const user = await getDefaultUser();
    return Response.json({ user });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}