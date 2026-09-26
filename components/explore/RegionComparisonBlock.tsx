import type { RegionComparison } from "@/lib/queries/explore";
import { pct, plural } from "@/lib/format";

/** "Compared with national average": this place's share of region-tagged reporting vs. two labelled baselines. */
export function RegionComparisonBlock({ c, label }: { c: RegionComparison; label: string }) {
  const rows = [
    { name: `${label}: share of region-tagged articles`, value: c.share, strong: true },
    { name: "Equal-share baseline (if every region got the same coverage)", value: c.equalShare, strong: false },
    { name: "Population-share baseline (PSA 2020 Census)", value: c.populationShare, strong: false },
  ];
  const max = Math.max(...rows.map((r) => r.value), 0.01);
  const ratio = c.populationShare ? c.share / c.populationShare : 0;
  const verdict =
    !c.totalTagged
      ? "There is no region-tagged reporting to compare yet."
      : ratio >= 1.25
        ? `${label} receives more coverage than its population share would suggest.`
        : ratio <= 0.75
          ? `${label} receives less coverage than its population share would suggest.`
          : `${label}'s coverage is roughly in line with its population share.`;
  return (
    <div>
      <dl className="space-y-3">
        {rows.map((r) => (
          <div key={r.name}>
            <div className="flex items-baseline justify-between gap-3">
              <dt className={`font-sans text-[13px] ${r.strong ? "font-semibold text-ink" : "text-ink-soft"}`}>{r.name}</dt>
              <dd className="font-sans text-sm font-semibold tabular-nums">{pct(r.value)}</dd>
            </div>
            <span className="mt-1 block h-1.5 bg-rule/50" aria-hidden>
              <span
                className={`block h-full ${r.strong ? "bg-forest" : "bg-ochre"}`}
                style={{ width: `${Math.max(1, (r.value / max) * 100)}%` }}
              />
            </span>
          </div>
        ))}
      </dl>
      <p className="mt-3 font-serif text-[15px] italic text-ink-soft">{verdict}</p>
      <p className="meta mt-2">
        Based on {plural(c.placeArticles, "article")} of {plural(c.totalTagged, "region-tagged article")} in{" "}
        {c.windowLabel}. Population shares are approximate, from the PSA 2020 Census; Negros Island Region is summed
        from its provinces. A gap is a prompt to look closer, not a judgment.
      </p>
    </div>
  );
}
