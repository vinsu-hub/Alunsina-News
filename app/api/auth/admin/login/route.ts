import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, cookieOptions, createSession, passwordMatches, takeLoginAttempt } from "@/lib/admin/session";
import { getDb } from "@/db/client";
export async function POST(request: NextRequest) {
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
