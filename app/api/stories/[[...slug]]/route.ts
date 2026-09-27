import type { NextRequest } from "next/server";
import {
  getFollowingFeed,
  getPersonalAreaFeed,
  getStorySummaries,
  isRegionId,
  isSourceTypeId,
  isTopic,
} from "@/lib/queries/personal";

const list = (v: string | null) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);

/**
 * GET /api/stories?ids=a,b,c                            → StorySummary[] in id order (unknown ids dropped)
 * GET /api/stories?topics=Health&regions=r4a&types=…    → stories matching any followed topic/region/source type
 */
async function stories(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.has("ids")) return Response.json({ stories: await getStorySummaries(list(sp.get("ids"))) });
  const topics = list(sp.get("topics")).filter(isTopic);
  const regions = list(sp.get("regions")).filter(isRegionId);
  const sourceTypes = list(sp.get("types")).filter(isSourceTypeId);
  if (!topics.length && !regions.length && !sourceTypes.length) return Response.json({ stories: [] });
  return Response.json({ stories: await getFollowingFeed({ topics, regions, sourceTypes }) });
}

/** GET /api/stories/area?region=r4a&place=San Pablo&province=Laguna → My Area feed (§18). */
async function areaFeed(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const region = sp.get("region") ?? "";
  if (!isRegionId(region)) return Response.json({ error: "Unknown region" }, { status: 400 });
  const place = (sp.get("place") ?? "").slice(0, 80);
  const province = (sp.get("province") ?? "").slice(0, 80);
  return Response.json(await getPersonalAreaFeed(region, place, province));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  if (!slug.length) return stories(req);
  if (slug.length === 1 && slug[0] === "area") return areaFeed(req);
  return new Response(null, { status: 404 });
}
