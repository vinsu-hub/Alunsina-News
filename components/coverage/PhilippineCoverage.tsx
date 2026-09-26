"use client";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { IslandTabs } from "@/components/ui/IslandTabs";
import { ISLAND_GROUPS, REGIONS, type IslandGroupId } from "@/lib/taxonomy";
import type { IslandCoverage } from "@/lib/types";
import { pct } from "@/lib/format";
export function PhilippinesMap({ selected }: { selected?: IslandGroupId }) {
  return (
    <svg
      viewBox="0 0 150 220"
      role="img"
      aria-label="Simplified map of the Philippines"
      className="mx-auto h-[190px] w-[130px]"
      fill="currentColor"
    >
      <g
        className={
          selected && selected !== "luzon" ? "text-forest/25" : "text-forest"
        }
      >
        <path d="m69 9 12 5 6 17-4 12 7 14-10 18-10 5-8-10-9-4 3-14-9-9 8-13 2-16Zm7 68 13 2 5 11 12 4 6 13-6 3-10-11-12-5-11-5Zm-19 9 8 3 3 16-7 9-9-12ZM41 110l5 5-8 18-8 11-5 15-6 7 5-21 8-17Z" />
      </g>
      <g
        className={
          selected && selected !== "visayas" ? "text-forest/25" : "text-forest"
        }
      >
        <path d="m69 112 12 4-2 11-10 3-5-9Zm15 15 6 4 3 17-5 7-5-14Zm12-9 5 2 4 16-4 11-4-9Zm16-14 10 9 1 13-8 8-6-7 6-10Zm-12 46 15-3 8 5-7 6-13-1Z" />
      </g>
      <g
        className={
          selected && selected !== "mindanao" ? "text-forest/25" : "text-forest"
        }
      >
        <path d="m113 159 13-4 8 12-4 10 8 13-9 8-8-8-7 14-19-2-10-11-9 1-12 12-9-1 13-17 13-7 13 3 6-13Zm-57 49 5 3-8 4-5-2Zm-17 8 4 2-5 2Z" />
      </g>
    </svg>
  );
}
export function CompactCoverage({ coverage }: { coverage: IslandCoverage[] }) {
  return (
    <section className="border border-rule p-3">
      <h2 className="font-serif text-[18px] uppercase">Philippines Coverage</h2>
      <div className="mt-3 flex items-center">
        <PhilippinesMap />
        <ul className="flex-1 space-y-4">
          {ISLAND_GROUPS.map((g) => (
            <li key={g.id} className="flex justify-between gap-2 text-[11px]">
              <span>{g.label}</span>
              <span>
                {pct(coverage.find((c) => c.island === g.id)?.share ?? 0)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Link href="/regions" className="link-quiet text-xs text-forest">
        View regional coverage →
      </Link>
    </section>
  );
}
export function PhilippineCoverage({
  coverage,
  compareTo,
  title = "Philippine Coverage",
  sub,
  primaryLabel = "This story",
  compareLabel = "All stories today",
  initialIsland,
  id,
}: {
  coverage: IslandCoverage[];
  compareTo?: IslandCoverage[];
  title?: string;
  sub?: ReactNode;
  primaryLabel?: string;
  compareLabel?: string;
  initialIsland?: IslandGroupId | null;
  id?: string;
}) {
  const generated = useId();
  const panelId = `${id ?? generated}-panel`;
  const [island, setIsland] = useState<IslandGroupId>(initialIsland ?? "luzon");
  const [compare, setCompare] = useState(false);
  const shown = compare && compareTo ? compareTo : coverage;
  const active = shown.find((c) => c.island === island);
  return (
    <section id={id} className="min-w-0 border border-rule p-3">
      <h2 className="font-serif text-[18px] uppercase">{title}</h2>
      {sub && <div className="meta mt-1">{sub}</div>}
      {compareTo && (
        <button
          aria-pressed={compare}
          onClick={() => setCompare(!compare)}
          className="link-quiet my-2 text-xs"
        >
          {compare ? compareLabel : primaryLabel} · switch scope
        </button>
      )}
      <IslandTabs
        value={island}
        onChange={setIsland}
        label="Philippine coverage island"
        panelId={panelId}
      />
      <div
        role="tabpanel"
        id={panelId}
        aria-label={`${island} coverage`}
        className="flex gap-4"
      >
        <PhilippinesMap selected={island} />
        <div className="min-w-0 flex-1">
          <p className="meta mb-3">
            {pct(active?.share ?? 0)} of region-tagged reports
          </p>
          <ul className="space-y-2">
            {active?.regions.map((r) => (
              <li key={r.regionId}>
                <Link
                  href={`/regions/${r.regionId}`}
                  className="flex justify-between text-[11px] text-forest"
                >
                  <span>{REGIONS.find((x) => x.id === r.regionId)?.label}</span>
                  <span>{r.articles} reports</span>
                </Link>
                <div className="mt-1 h-0.5 bg-rule">
                  <div
                    className="h-full bg-forest"
                    style={{ width: pct(r.share) }}
                  />
                </div>
              </li>
            ))}
          </ul>
          {!active?.articles && (
            <p className="meta">No reporting tagged to this island yet.</p>
          )}
        </div>
      </div>
      <Link
        href="/regions"
        className="link-quiet mt-3 inline-block text-xs text-forest"
      >
        View regional coverage →
      </Link>
    </section>
  );
}
