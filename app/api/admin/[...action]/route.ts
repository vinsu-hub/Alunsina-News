import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, assertAdminSession, cookieOptions, createSession, passwordMatches, takeLoginAttempt } from "@/lib/admin/session";
import { getDb } from "@/db/client";
import { publishPitch, triggerIngest } from "@/lib/queries/admin";

export const maxDuration = 300;
type Context = { params: Promise<{ action: string[] }> };

async function login(request: NextRequest) {
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!takeLoginAttempt(ip)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  let password: unknown;
  try {
    password = request.headers.get("content-type")?.includes("application/json") ? (await request.json()).password : (await request.formData()).get("password");
  } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof password !== "string" || !passwordMatches(password)) return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  if (!process.env.ADMIN_SESSION_SECRET) return NextResponse.json({ error: "Admin session is not configured" }, { status: 503 });
  const response = request.headers.get("content-type")?.includes("application/json") ? NextResponse.json({ ok: true }) : NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, createSession(), cookieOptions);
  await (await getDb()).execute(`INSERT INTO admin_audit(action,entity,detail) VALUES ('login','session','{}')`);
  return response;
}

function actionMethod(action: string[]): "GET" | "POST" | null {
  if (action.length === 1) {
    if (action[0] === "session") return "GET";
    if (["login", "logout", "ingest"].includes(action[0])) return "POST";
  }
  if (action.length === 3 && action[0] === "pitches" && action[2] === "publish") return "POST";
  return null;
}

async function dispatch(request: NextRequest, { params }: Context) {
  const { action } = await params;
  // Login is the sole public action. Keep the assertion inside the handler too.
  if (!(action.length === 1 && action[0] === "login")) await assertAdminSession();
  const method = actionMethod(action);
  if (!method) return new Response(null, { status: 404 });
  const allow = method === "GET" ? "GET, HEAD, OPTIONS" : "OPTIONS, POST";
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { Allow: allow } });
  if (request.method !== method && !(method === "GET" && request.method === "HEAD")) return new Response(null, { status: 405 });
  if (method === "GET") return Response.json({ authenticated: true });
  if (action[0] === "login") return login(request);
  if (action[0] === "logout") {
    await (await getDb()).execute(`INSERT INTO admin_audit(action,entity,detail) VALUES ('logout','session','{}')`);
    (await cookies()).set(ADMIN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return NextResponse.json({ ok: true });
  }
  if (action[0] === "ingest") return Response.json(await triggerIngest());
  try { return Response.json(await publishPitch(action[1], await request.json())); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Invalid publication' }, { status: 400 }); }
}

export const GET = dispatch;
export const POST = dispatch;
export const OPTIONS = dispatch;
