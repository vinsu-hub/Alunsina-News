"use client";
// Philippine Coverage (§17): a tile cartogram of the 17 regions, positioned
// roughly where they sit geographically, synced with the shared
// CoverageBreakdown list. Reusable on Home, Story, and Regions pages.
import { useState, type ReactNode } from "react";
import { CoverageBreakdown } from "@/components/ui";
import { ISLAND_GROUPS, REGIONS, type IslandGroupId, type RegionId } from "@/lib/taxonomy";
import type { IslandCoverage } from "@/lib/types";
import { pct } from "@/lib/format";

/* ---------- cartogram layout ---------- */

// Short tile codes; full names come from the taxonomy.
const TILE_CODE: Record<RegionId, string> = {
  ncr: "NCR",
  car: "CAR",
  r1: "I",
  r2: "II",
  r3: "III",
  r4a: "IV-A",
  r4b: "IV-B",
  r5: "V",
  r6: "VI",
  nir: "NIR",
  r7: "VII",
  r8: "VIII",
  r9: "IX",
  r10: "X",
  r11: "XI",
  r12: "XII",
  r13: "XIII",
  barmm: "BARMM",
};

// [column, row] on a loose geographic grid (north at top).
const TILE_POS: Record<RegionId, [number, number]> = {
  r1: [0, 0],
  car: [1, 0],
  r2: [2, 0],
  r3: [1, 1],
  ncr: [1, 2],
  r4a: [2, 2],
  r4b: [0, 3],
  r5: [3, 3],
  r6: [1, 4],
  r8: [3, 4],
  nir: [1, 5],
  r7: [2, 5],
  r9: [0, 6],
  r10: [1, 6],
  r13: [2, 6],
  barmm: [0, 7],
  r12: [1, 7],
  r11: [2, 7],
};

const TILE = 46;
const GAP = 4;
// Extra vertical space between island groups so they read as three groups.
const GROUP_GAP: Record<IslandGroupId, number> = { luzon: 0, visayas: 14, mindanao: 28 };
const PAD_LEFT = 4;
const LABEL_W = 78;
const COLS = 4;
const ROWS = 8;
const VIEW_W = PAD_LEFT + COLS * (TILE + GAP) + LABEL_W;
const VIEW_H = ROWS * (TILE + GAP) + GROUP_GAP.mindanao + 4;

const islandOf = (id: RegionId) => REGIONS.find((r) => r.id === id)!.island as IslandGroupId;
const islandLabel = (id: IslandGroupId) => ISLAND_GROUPS.find((g) => g.id === id)!.label;

function tileXY(id: RegionId) {
  const [c, r] = TILE_POS[id];
  return { x: PAD_LEFT + c * (TILE + GAP), y: 2 + r * (TILE + GAP) + GROUP_GAP[islandOf(id)] };
}

// Island label sits to the right of each group, vertically centred on it.
const ISLAND_LABEL_Y: Record<IslandGroupId, number> = {
  luzon: 2 + 1.5 * (TILE + GAP) + TILE / 2,
  visayas: 2 + 4.5 * (TILE + GAP) + GROUP_GAP.visayas + TILE / 2,
  mindanao: 2 + 6.5 * (TILE + GAP) + GROUP_GAP.mindanao + TILE / 2,
};

/** Forest fill with opacity by share; sqrt scale so small shares stay visible. */
function shade(share: number, max: number) {
  if (share <= 0 || max <= 0) return { fill: "var(--paper-deep)", opacity: 1, dark: false };
  const t = Math.sqrt(share / max);
  const opacity = 0.14 + 0.86 * t;
  return { fill: "var(--forest)", opacity, dark: opacity > 0.5 };
}

/* ---------- component ---------- */

type Mode = "primary" | "compare";

export function PhilippineCoverage({
  coverage,
  compareTo,
  title = "Philippine Coverage",
  sub,
  primaryLabel = "This story",
  compareLabel = "All stories today",
  initialIsland = null,
  id,
}: {
  coverage: IslandCoverage[];
  /** Baseline (e.g. platform-wide today). Enables the toggle and the "national average" comparison. */
  compareTo?: IslandCoverage[];
  title?: string;
  sub?: ReactNode;
  primaryLabel?: string;
  compareLabel?: string;
  initialIsland?: IslandGroupId | null;
  id?: string;
}) {
  const [mode, setMode] = useState<Mode>("primary");
  const [island, setIsland] = useState<IslandGroupId | null>(initialIsland);
  // Bumped when the map (not the list) changes the island, so the list remounts
  // with the new selection; list clicks don't remount, keeping keyboard focus.
  const [listKey, setListKey] = useState(0);

  const shown = mode === "compare" && compareTo ? compareTo : coverage;
  const baseline = mode === "compare" ? null : (compareTo ?? null);
  const total = shown.reduce((a, c) => a + c.articles, 0);

  const selectFromMap = (next: IslandGroupId | null) => {
    setIsland(next);
    setListKey((k) => k + 1);
  };
  const switchMode = (m: Mode) => {
    setMode(m);
    setListKey((k) => k + 1);
  };

  const byRegion = new Map(shown.flatMap((c) => c.regions.map((r) => [r.regionId, r] as const)));
  const byIsland = new Map(shown.map((c) => [c.island, c] as const));
  const maxIsland = Math.max(0, ...shown.map((c) => c.share));
  const selected = island ? byIsland.get(island) : null;
  const maxRegion = selected ? Math.max(0, ...selected.regions.map((r) => r.share)) : 0;

  return (
    <section aria-labelledby={id ? `${id}-title` : undefined} id={id}>
      <header className="section-head mb-4">
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 className="kicker text-ink" id={id ? `${id}-title` : undefined}>
            {title}
          </h2>
          {compareTo && (
            <div role="group" aria-label="Coverage scope" className="flex border border-ink font-sans text-[11px] font-semibold uppercase tracking-wide">
              {(["primary", "compare"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => switchMode(m)}
                  className={`px-2.5 py-1 ${mode === m ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
                >
                  {m === "primary" ? primaryLabel : compareLabel}
                </button>
              ))}
            </div>
          )}
        </div>
        {sub && <div className="mt-1 font-serif text-[15px] italic text-ink-soft">{sub}</div>}
      </header>

      {!total ? (
        <p className="meta">No region-tagged reporting yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-[minmax(0,240px)_1fr]">
          <figure className="mx-auto w-full max-w-[240px]">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="h-auto w-full"
              role="group"
              aria-label={`Map of coverage by region, ${mode === "primary" ? primaryLabel : compareLabel}`}
            >
              {REGIONS.map((r) => {
                const rid = r.id as RegionId;
                const isl = islandOf(rid);
                const { x, y } = tileXY(rid);
                const inFocus = !island || island === isl;
                const drill = island === isl;
                const regionCov = byRegion.get(rid);
                const s = drill
                  ? shade(regionCov?.share ?? 0, maxRegion)
                  : shade(byIsland.get(isl)?.share ?? 0, maxIsland);
                const tile = (
                  <>
                    <rect
                      x={x}
                      y={y}
                      width={TILE}
                      height={TILE}
                      fill="var(--paper)"
                      stroke={drill ? "var(--ink)" : "var(--rule)"}
                      strokeWidth={drill ? 1 : 0.75}
                    />
                    <rect x={x + 0.5} y={y + 0.5} width={TILE - 1} height={TILE - 1} fill={s.fill} fillOpacity={s.opacity} />
                    <text
                      x={x + TILE / 2}
                      y={y + TILE / 2 + (drill ? -2 : 4)}
                      textAnchor="middle"
                      className="font-sans"
                      fontSize={rid === "barmm" ? 10 : 11}
                      fontWeight={600}
                      fill={s.dark ? "var(--paper)" : "var(--ink-soft)"}
                    >
                      {TILE_CODE[rid]}
                    </text>
                    {drill && (
                      <text
                        x={x + TILE / 2}
                        y={y + TILE / 2 + 12}
                        textAnchor="middle"
                        className="font-sans tabular-nums"
                        fontSize={10}
                        fill={s.dark ? "var(--paper)" : "var(--ink-muted)"}
                      >
                        {pct(regionCov?.share ?? 0)}
                      </text>
                    )}
                  </>
                );
                return (
                  <g key={rid} opacity={inFocus ? 1 : 0.35} className="transition-opacity">
                    {drill ? (
                      <a href={`/regions/${rid}`} aria-label={`${r.label} (${r.name}): ${pct(regionCov?.share ?? 0)} of reports. Open region`}>
                        <title>{`${r.label} · ${r.name}: ${regionCov?.articles ?? 0} reports`}</title>
                        {tile}
                      </a>
                    ) : (
                      <g
                        role="button"
                        tabIndex={-1}
                        className="cursor-pointer"
                        onClick={() => selectFromMap(isl)}
                        aria-label={`Show ${islandLabel(isl)} regions`}
                      >
                        <title>{`${r.label} · ${islandLabel(isl)}`}</title>
                        {tile}
                      </g>
                    )}
                  </g>
                );
              })}
              {ISLAND_GROUPS.map((g) => {
                const c = byIsland.get(g.id);
                const active = island === g.id;
                const yMid = ISLAND_LABEL_Y[g.id];
                const xL = PAD_LEFT + COLS * (TILE + GAP) + 6;
                return (
                  <g
                    key={g.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={active}
                    aria-label={`${g.label}: ${pct(c?.share ?? 0)} of reports. ${active ? "Collapse" : "Show regions"}`}
                    className="cursor-pointer focus:outline-none [&:focus-visible>rect]:stroke-forest"
                    onClick={() => selectFromMap(active ? null : g.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectFromMap(active ? null : g.id);
                      }
                    }}
                  >
                    <rect x={xL - 4} y={yMid - 22} width={LABEL_W - 4} height={40} fill="transparent" stroke="transparent" strokeWidth={1.5} />
                    <text x={xL} y={yMid - 6} className="font-sans" fontSize={10} fontWeight={600} letterSpacing="0.1em" fill={active ? "var(--terracotta)" : "var(--ink)"}>
                      {g.label.toUpperCase()}
                    </text>
                    <text x={xL} y={yMid + 12} className="font-serif tabular-nums" fontSize={18} fill="var(--ink)">
                      {pct(c?.share ?? 0)}
                    </text>
                  </g>
                );
              })}
            </svg>
            <figcaption className="meta mt-2 flex items-center gap-2">
              <span className="inline-flex h-2 w-16" aria-hidden>
                {[0.14, 0.35, 0.56, 0.78, 1].map((o) => (
                  <span key={o} className="flex-1 bg-forest" style={{ opacity: o }} />
                ))}
              </span>
              Share of region-tagged reports{island ? ` within ${islandLabel(island)}` : ""}
            </figcaption>
          </figure>

          <div className="min-w-0">
            <CoverageBreakdown
              key={`${mode}-${listKey}`}
              coverage={shown}
              regionHref={regionHref}
              initialIsland={island}
              onIslandChange={setIsland}
            />
            <ComparisonNote
              island={island ?? topIsland(shown)}
              explicit={Boolean(island)}
              shown={shown}
              baseline={baseline}
              scopeLabel={mode === "primary" ? primaryLabel.toLowerCase() : compareLabel.toLowerCase()}
              baselineLabel={compareLabel.toLowerCase()}
            />
            <p className="meta mt-3">
              {total} region-tagged {total === 1 ? "report" : "reports"}. Select an island group to see its regions; select a region to see its stories and sources.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

// Plain function reference, not passed across the server/client boundary.
const regionHref = (id: string) => `/regions/${id}`;

function topIsland(cov: IslandCoverage[]): IslandGroupId | null {
  const top = [...cov].sort((a, b) => b.share - a.share)[0];
  return top && top.articles > 0 ? top.island : null;
}

function ComparisonNote({
  island,
  explicit,
  shown,
  baseline,
  scopeLabel,
  baselineLabel,
}: {
  island: IslandGroupId | null;
  explicit: boolean;
  shown: IslandCoverage[];
  baseline: IslandCoverage[] | null;
  scopeLabel: string;
  baselineLabel: string;
}) {
  if (!island) return null;
  const share = shown.find((c) => c.island === island)?.share ?? 0;
  const baseTotal = baseline?.reduce((a, c) => a + c.articles, 0) ?? 0;
  const ref = baseline && baseTotal ? (baseline.find((c) => c.island === island)?.share ?? 0) : 1 / 3;
  const refLabel = baseline && baseTotal ? `across ${baselineLabel}` : "if reports were split evenly across island groups";
  const diff = Math.round((share - ref) * 100);
  const direction = diff === 0 ? "in line with" : diff > 0 ? `${diff} pts above` : `${-diff} pts below`;
  return (
    <div className="mt-4 border-l-2 border-ochre pl-3" aria-live="polite">
      <p className="kicker text-ink-muted">Compared with national average</p>
      <p className="mt-1 font-serif text-[15px] leading-snug text-ink">
        {islandLabel(island)} accounts for <strong className="font-semibold">{pct(share)}</strong> of reports on {scopeLabel}, {direction} the{" "}
        {pct(ref)} {refLabel}.
      </p>
      {!explicit && <p className="meta mt-1">Showing the largest island group. Select another to compare.</p>}
    </div>
  );
}
