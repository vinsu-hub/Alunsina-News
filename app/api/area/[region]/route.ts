import { getAreaSummary, isRegionId } from "@/lib/queries/home";

// GET /api/area/:region — My Area teaser data: counts + top 3 local stories.
export async function GET(_req: Request, ctx: RouteContext<"/api/area/[region]">) {
  const { region } = await ctx.params;
  if (!isRegionId(region)) return Response.json({ error: "Unknown region" }, { status: 404 });
  return Response.json(await getAreaSummary(region), { headers: { "Cache-Control": "no-store" } });
}
