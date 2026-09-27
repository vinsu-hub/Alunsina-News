import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, assertAdminSession, cookieOptions } from "@/lib/admin/session";
import { getDb } from "@/db/client";
export async function POST() {
  await assertAdminSession();
  await (await getDb()).execute(`INSERT INTO admin_audit(action,entity,detail) VALUES ('logout','session','{}')`);
  (await cookies()).set(ADMIN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return NextResponse.json({ ok: true });
}
