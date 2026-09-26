"use client";
// Thin client wrapper: CoverageBreakdown takes a `regionHref` function, which a
// Server Component can't pass across the boundary.
import { CoverageBreakdown } from "@/components/ui";
import type { IslandCoverage } from "@/lib/types";

export function StoryCoverageBreakdown({ coverage }: { coverage: IslandCoverage[] }) {
  const top = [...coverage].sort((a, b) => b.articles - a.articles)[0];
  return (
    <CoverageBreakdown
      coverage={coverage}
      regionHref={(id) => `/regions/${id}`}
      initialIsland={top && top.articles > 0 ? top.island : null}
    />
  );
}
