import type { NextRequest } from "next/server";
import { getPersonalAreaFeed, isRegionId } from "@/lib/queries/personal";

/** GET /api/stories/area?region=r4a&place=San Pablo&province=Laguna → My Area feed (§18). */
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const region = sp.get("region") ?? "";
  if (!isRegionId(region)) return Response.json({ error: "Unknown region" }, { status: 400 });
  const place = (sp.get("place") ?? "").slice(0, 80);
  const province = (sp.get("province") ?? "").slice(0, 80);
  return Response.json(getPersonalAreaFeed(region, place, province));
}
