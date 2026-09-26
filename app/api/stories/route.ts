import type { NextRequest } from "next/server";
import {
  getFollowingFeed,
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
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.has("ids")) return Response.json({ stories: getStorySummaries(list(sp.get("ids"))) });
  const topics = list(sp.get("topics")).filter(isTopic);
  const regions = list(sp.get("regions")).filter(isRegionId);
  const sourceTypes = list(sp.get("types")).filter(isSourceTypeId);
  if (!topics.length && !regions.length && !sourceTypes.length) return Response.json({ stories: [] });
  return Response.json({ stories: getFollowingFeed({ topics, regions, sourceTypes }) });
}
