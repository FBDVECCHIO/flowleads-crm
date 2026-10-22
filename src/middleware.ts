import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas que não exigem autenticação
const PUBLIC_PATHS = [
  "/auth/login",
  "/api/auth/login",
  "/api/webhooks/meta",
  "/api/webhooks/inbound",
  "/api/v1/webhook/inbound",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // Formulários públicos de captura de leads e sua API de submissão
  if (pathname.startsWith("/public/forms") || pathname.startsWith("/api/public-form")) {
    return true;
  }
  // Arquivos estáticos
  if (
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".woff") ||
    pathname.endsWith(".woff2")
  ) {
    return true;
  }
  return false;
}

function base64UrlToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function verifyEdgeSession(token: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [data64, sig] = parts;
  const secret = process.env.SESSION_SECRET || "0e616191dea58c85946521a8ff8e5a3b2d52801080a807529e904709623c8231";

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const binarySig = base64UrlToBytes(sig);
    const valid = await crypto.subtle.verify("HMAC", key, binarySig, encoder.encode(data64));
    if (!valid) return false;

    let base64 = data64.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const payload = JSON.parse(atob(base64));
    if (!payload || !payload.issuedAt) return false;
    if (Date.now() - payload.issuedAt > 24 * 60 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir rotas públicas
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Extrair token de sessão do cookie ou cabeçalho Authorization
  let token: string | null = null;
  const sessionCookie = req.cookies.get("flowleads_session")?.value;
  if (sessionCookie) {
    token = decodeURIComponent(sessionCookie);
  } else {
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  const isValid = token ? await verifyEdgeSession(token) : false;

  if (!isValid) {
    // Para chamadas de API, retornar HTTP 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Não autenticado. Por favor, realize o login para continuar." },
        { status: 401 }
      );
    }

    // Para navegação de páginas, redirecionar para a tela de login
    const loginUrl = new URL("/auth/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
