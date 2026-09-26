"use client";
// §18 My Area teaser: a boxed "local insert" driven by the viewer's saved area.
import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverageChip } from "@/components/ui/CoverageChip";
import { StoryImage } from "@/components/ui/StoryImage";
import { Icon } from "@/components/ui";
import { PREF_KEYS, usePref } from "@/lib/prefs";
import { timeAgo } from "@/lib/format";
import type { RegionId } from "@/lib/taxonomy";
import type { AreaSummary } from "@/lib/queries/home-types";

type Area = { key: string; name: string; province: string; region: RegionId };
type Loaded = {
  region: string;
  data:
    | (AreaSummary & { leadImage?: { url: string; credit: string } | null })
    | null;
};

export function MyAreaTeaser() {
  const [areas, , ready] = usePref<Area[]>(PREF_KEYS.area, []);
  const area = areas[0] ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!area?.region) return;
    const ctrl = new AbortController();
    fetch(`/api/area/${area.region}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<AreaSummary>) : null))
      .then((data) => setLoaded({ region: area.region, data }))
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError")
          setLoaded({ region: area.region, data: null });
      });
    return () => ctrl.abort();
  }, [area?.region]);

  const data = area && loaded?.region === area.region ? loaded.data : undefined;

  return (
    <section
      aria-labelledby="myarea-title"
      className="border border-rule bg-paper p-4"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-ink pb-2">
        <h2 id="myarea-title" className="kicker text-ink">
          My Area
          {area && (
            <span className="font-serif text-[15px] font-normal normal-case tracking-normal text-ink">
              {" "}
              — {area.name}
              {area.province && area.province !== area.name
                ? ` · ${area.province}`
                : ""}
            </span>
          )}
        </h2>
        {area && (
          <Link
            href="/my-area"
            className="meta font-semibold text-forest hover:underline underline-offset-4"
          >
            Change location <span aria-hidden>→</span>
          </Link>
        )}
      </header>

      {!ready ? (
        <div className="h-32" aria-hidden />
      ) : !area ? (
        <div className="py-3 text-center">
          <StoryImage image={null} alt="" topic="Local coverage" />
          <Icon name="pin" size={26} className="mx-auto text-terracotta" />
          <p className="headline mt-2 text-xl leading-snug">
            Set your area to see local coverage
          </p>
          <p className="mt-1.5 font-serif text-[15px] text-ink-soft">
            Stories, government updates, and community reports from your city or
            municipality.
          </p>
          <Link
            href="/my-area"
            className="mt-4 inline-flex items-center gap-2 border border-ink px-3.5 py-2 font-sans text-sm font-semibold text-ink hover:bg-ink hover:text-paper"
          >
            Set your area <span aria-hidden>→</span>
          </Link>
        </div>
      ) : data === undefined ? (
        <p className="meta py-6" role="status">
          Loading local coverage…
        </p>
      ) : data === null ? (
        <p className="meta py-6">Local coverage is unavailable right now.</p>
      ) : (
        <div>
          <StoryImage
            image={data.leadImage}
            alt={data.stories[0]?.title ?? ""}
            topic="Local coverage"
            className="mt-3"
          />
          <p className="meta mt-2">
            {data.region.label} · {data.region.name}
          </p>
          <dl className="mt-3 grid grid-cols-3 border-y border-rule text-center">
            {[
              { n: data.counts.local, label: "Local stories" },
              { n: data.counts.regional, label: "Regional stories" },
              { n: data.counts.government, label: "Gov't updates" },
            ].map((c) => (
              <div
                key={c.label}
                className="flex flex-col-reverse justify-end gap-0.5 border-r border-rule py-2 last:border-r-0"
              >
                <dt className="meta text-[11px]">{c.label}</dt>
                <dd className="font-serif text-2xl leading-none tabular-nums">
                  {c.n}
                </dd>
              </div>
            ))}
          </dl>
          {data.stories.length === 0 ? (
            <p className="mt-3 font-serif text-[15px] italic text-ink-soft">
              No local stories yet today.
            </p>
          ) : (
            <ol className="mt-1 divide-y divide-rule">
              {data.stories.map((s) => (
                <li key={s.id} className="py-2.5">
                  <span className="kicker text-forest">{s.topic}</span>
                  <h3 className="headline mt-0.5 text-[16px] leading-snug">
                    <Link
                      href={`/story/${s.id}`}
                      className="hover:underline underline-offset-4"
                    >
                      {s.title}
                    </Link>
                  </h3>
                  <p className="meta mt-0.5">
                    <CoverageChip
                      storyId={s.id}
                      stats={{ sources: s.sources }}
                      className="flex-wrap text-[10px]"
                    />{" "}
                    · {timeAgo(s.updatedAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
          <p className="meta mt-2 border-t border-rule pt-2">
            {data.counts.community} community{" "}
            {data.counts.community === 1 ? "report" : "reports"} ·{" "}
            {data.counts.sources} local{" "}
            {data.counts.sources === 1 ? "source" : "sources"} ·{" "}
            <Link
              href="/my-area"
              className="font-semibold text-forest hover:underline underline-offset-4"
            >
              View all local stories →
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
