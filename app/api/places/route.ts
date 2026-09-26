import type { NextRequest } from "next/server";
import { nearestPlace, placeKey, searchPlaces, type Place } from "@/lib/gazetteer";

// Rough bounding box of the Philippines; outside it a "nearest city" would be meaningless.
const PH = { minLat: 4.2, maxLat: 21.3, minLng: 116.0, maxLng: 127.0 };

const out = (p: Place) => ({ key: placeKey(p), name: p.name, province: p.province, region: p.region, kind: p.kind });

/**
 * GET /api/places?q=san pab      → { places } city/municipality matches
 * GET /api/places?lat=..&lng=..  → { place } nearest known city/municipality, or { place: null, reason }
 */
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.has("lat") && sp.has("lng")) {
    const lat = Number(sp.get("lat"));
    const lng = Number(sp.get("lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
      return Response.json({ place: null, reason: "invalid" }, { status: 400 });
    if (lat < PH.minLat || lat > PH.maxLat || lng < PH.minLng || lng > PH.maxLng)
      return Response.json({ place: null, reason: "outside" });
    return Response.json({ place: out(nearestPlace(lat, lng)) });
  }
  const q = (sp.get("q") ?? "").slice(0, 80);
  return Response.json({ places: searchPlaces(q, 8).map(out) });
}
