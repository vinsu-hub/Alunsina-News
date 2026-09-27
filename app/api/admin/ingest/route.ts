import { assertAdminSession } from "@/lib/admin/session";
import { triggerIngest } from "@/lib/queries/admin";
export const maxDuration = 300;
export async function POST() { await assertAdminSession(); return Response.json(await triggerIngest()); }
