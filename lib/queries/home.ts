// Front-page helpers (Agent B). Builds on the shared read API.
import "server-only";
import { getAreaFeed, listStories } from "@/lib/queries";
import { REGIONS, type RegionId } from "@/lib/taxonomy";
import type { AreaSummary } from "./home-types";

export type { AreaSummary } from "./home-types";

export const isRegionId = (id: string): id is RegionId => REGIONS.some((r) => r.id === id);

/** Counts plus the top three local stories for the My Area teaser. */
export async function getAreaSummary(regionId: RegionId): Promise<AreaSummary> {
  const r = REGIONS.find((x) => x.id === regionId)!;
  const feed = await getAreaFeed(regionId);
  const regional = await listStories({ island: r.island, limit: 60 });
  return {
    region: { id: r.id, label: r.label, name: r.name, island: r.island },
    counts: {
      local: feed.local.length,
      regional: regional.length,
      government: feed.govt.length,
      community: feed.community.length,
      sources: feed.sources.length,
    },
    stories: feed.local.slice(0, 3).map((s) => ({
      id: s.id,
      title: s.title,
      topic: s.topic,
      status: s.status,
      updatedAt: s.updatedAt,
      sources: s.stats.sources,
    })),
  };
}
