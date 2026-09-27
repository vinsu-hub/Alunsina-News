import { assertAdminSession } from "@/lib/admin/session";
import { publishPitch } from "@/lib/queries/admin";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await assertAdminSession();
  try { return Response.json(await publishPitch((await params).id, await request.json())); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Invalid publication' }, { status: 400 }); }
}
