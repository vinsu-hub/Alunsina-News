import { getAreaFeed } from "@/lib/queries";
import { getAreaSummary, isRegionId } from "@/lib/queries/home";

// GET /api/area/:region — My Area teaser data: counts + top 3 local stories.
export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/area/[region]">,
) {
  const { region } = await ctx.params;
  if (!isRegionId(region))
    return Response.json({ error: "Unknown region" }, { status: 404 });
  const [summary, feed] = await Promise.all([
    getAreaSummary(region),
    getAreaFeed(region),
  ]);
  return Response.json(
    { ...summary, leadImage: feed.local[0]?.leadImage ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
