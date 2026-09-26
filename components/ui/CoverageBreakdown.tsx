"use client";
import { useState } from "react";
import { ISLAND_GROUPS, REGIONS, type IslandGroupId } from "@/lib/taxonomy";
import type { IslandCoverage } from "@/lib/types";
import { pct } from "@/lib/format";

/**
 * Island group → region drill-down (§17). The same system at two zoom levels:
 * default shows Luzon/Visayas/Mindanao; clicking one expands its regions.
 * `regionHref` makes each region a link (e.g. to /regions/[id]).
 */
export function CoverageBreakdown({
  coverage,
  regionHref,
  initialIsland = null,
  onIslandChange,
}: {
  coverage: IslandCoverage[];
  regionHref?: (regionId: string) => string;
  initialIsland?: IslandGroupId | null;
  onIslandChange?: (island: IslandGroupId | null) => void;
}) {
  const [open, setOpen] = useState<IslandGroupId | null>(initialIsland);
  const toggle = (id: IslandGroupId) => {
    const next = open === id ? null : id;
    setOpen(next);
    onIslandChange?.(next);
  };
  const total = coverage.reduce((a, c) => a + c.articles, 0);
  if (!total) return <p className="meta">No region-tagged reporting yet.</p>;
  return (
    <ul className="divide-y divide-rule border-y border-rule">
      {coverage.map((c) => {
        const label = ISLAND_GROUPS.find((g) => g.id === c.island)!.label;
        const expanded = open === c.island;
        return (
          <li key={c.island}>
            <button
              type="button"
              onClick={() => toggle(c.island)}
              aria-expanded={expanded}
              className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 py-2 text-left"
            >
              <span className="flex items-center gap-2 font-sans text-sm font-semibold text-ink">
                <span className={`inline-block text-[10px] text-ink-muted transition-transform ${expanded ? "rotate-90" : ""}`} aria-hidden>▶</span>
                {label}
              </span>
              <span className="font-sans text-sm font-semibold tabular-nums">{pct(c.share)}</span>
              <Bar share={c.share} className="col-span-2 mt-1.5" strong />
            </button>
            {expanded && (
              <ul className="pb-3 pl-5">
                {c.regions
                  .filter((r) => r.articles > 0)
                  .sort((a, b) => b.articles - a.articles)
                  .map((r) => {
                    const name = REGIONS.find((x) => x.id === r.regionId)!;
                    const inner = (
                      <>
                        <span className="font-sans text-[13px] text-ink-soft">{name.label}</span>
                        <span className="meta">{pct(r.share)}</span>
                        <Bar share={r.share} className="col-span-2" />
                      </>
                    );
                    return (
                      <li key={r.regionId}>
                        {regionHref ? (
                          <a href={regionHref(r.regionId)} className="grid grid-cols-[1fr_auto] gap-x-3 py-1 hover:[&>span:first-child]:underline">
                            {inner}
                          </a>
                        ) : (
                          <div className="grid grid-cols-[1fr_auto] gap-x-3 py-1">{inner}</div>
                        )}
                      </li>
                    );
                  })}
                {c.regions.every((r) => r.articles === 0) && <li className="meta py-1">No reports tagged to {label} regions.</li>}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Bar({ share, className = "", strong = false }: { share: number; className?: string; strong?: boolean }) {
  return (
    <span className={`block h-1 bg-rule/50 ${className}`} aria-hidden>
      <span className={`block h-full ${strong ? "bg-forest" : "bg-ochre"}`} style={{ width: `${Math.max(1, share * 100)}%` }} />
    </span>
  );
}
