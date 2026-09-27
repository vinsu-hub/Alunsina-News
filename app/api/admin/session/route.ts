import { assertAdminSession } from "@/lib/admin/session";
export async function GET() { await assertAdminSession(); return Response.json({ authenticated: true }); }
