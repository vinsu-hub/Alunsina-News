"use client";
import Link from "next/link";
import { useState } from "react";
import { Rule, SourceTypeBadge, StoryCard } from "@/components/ui";
import { plural } from "@/lib/format";
import { region as regionOf } from "@/lib/taxonomy";
import type { Source, StorySummary } from "@/lib/types";
import { PlacePicker } from "./PlacePicker";
import { useAreas, useJson, type AreaPlace } from "./prefs";
import { Loading, Skeleton } from "./Skeleton";

interface AreaFeed {
  region: string;
  windowHours: number;
  local: StorySummary[];
  regional: StorySummary[];
  government: StorySummary[];
  community: StorySummary[];
  sources: (Source & { articleCount: number })[];
}

/** Client shell for /my-area: reads the area pref, then fetches the local insert. */
export function MyAreaView() {
  const [areas, setAreas, ready] = useAreas();
  const [changing, setChanging] = useState(false);
  const primary = areas[0] ?? null;

  const select = (p: AreaPlace) => {
    setAreas([p, ...areas.slice(1).filter((a) => a.key !== p.key)]);
    setChanging(false);
  };

  if (!ready) return <Frame><Skeleton lines={4} className="mt-6" /></Frame>;

  if (!primary)
    return (
      <Frame>
        <Header />
        <section aria-labelledby="set-area" className="mt-6 border border-ink p-4 md:p-8">
          <h2 id="set-area" className="headline text-2xl font-semibold md:text-3xl">
            Set your area to see local coverage
          </h2>
          <p className="mt-2 max-w-xl font-serif text-[16px] leading-relaxed text-ink-soft">
            Choose your city or municipality. We&rsquo;ll gather stories that name it, reporting from its region,
            government updates, community reports, and the local outlets covering it.
          </p>
          <div className="mt-6">
            <PlacePicker onSelect={select} />
          </div>
        </section>
      </Frame>
    );

  return (
    <Frame>
      <Header
        place={primary}
        action={
          !changing && (
            <button
              type="button"
              onClick={() => setChanging(true)}
              aria-expanded={changing}
              className="font-sans text-sm font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
            >
              Change location <span aria-hidden>→</span>
            </button>
          )
        }
      />
      {changing && (
        <section aria-label="Change location" className="mt-4 border border-ink p-4 md:p-6">
          <PlacePicker onSelect={select} onCancel={() => setChanging(false)} autoFocus />
        </section>
      )}
      <AreaFeedSections place={primary} />
      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
        <button
          type="button"
          disabled
          aria-describedby="add-area-note"
          className="cursor-not-allowed border border-dashed border-rule px-3 py-1.5 font-sans text-sm text-ink-muted"
        >
          + Add another area
        </button>
        <span id="add-area-note" className="meta">
          Coming soon. For now you can follow one area.
        </span>
      </div>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-10">{children}</div>;
}

function Header({ place, action }: { place?: AreaPlace; action?: React.ReactNode }) {
  return (
    <header>
      <Rule double />
      <div className="flex flex-col gap-2 py-3 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0">
          <p className="kicker text-ink-muted">Local insert{place ? ` · ${regionOf(place.region).label}` : ""}</p>
          <h1 className="headline mt-1 text-[32px] font-semibold uppercase leading-none tracking-[0.02em] md:text-5xl">
            My Area
            {place && (
              <span className="mt-1 block font-normal normal-case tracking-[-0.01em] text-forest-dark md:mt-0 md:inline">
                <span className="hidden md:inline" aria-hidden> — </span>
                {place.name}
                <span className="text-ink-soft"> · {place.province}</span>
              </span>
            )}
          </h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <Rule />
    </header>
  );
}

function AreaFeedSections({ place }: { place: AreaPlace }) {
  const url = `/api/stories/area?region=${place.region}&place=${encodeURIComponent(place.name)}&province=${encodeURIComponent(place.province)}`;
  const { data, error, loading } = useJson<AreaFeed>(url);
  const regionLabel = regionOf(place.region).label;

  if (error)
    return (
      <p role="alert" className="mt-6 font-sans text-sm text-terracotta">
        We couldn&rsquo;t load coverage for {place.name} right now. Reload the page to try again.
      </p>
    );
  if (loading || !data) return <Loading label={`Loading coverage for ${place.name}`} lines={4} className="mt-6" />;

  const span = `in the last ${data.windowHours} hours`;
  const shortName = place.name.replace(/\s*\(.*\)$/, "");
  return (
    <>
      <p className="border-b border-ink py-2 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-ink tabular-nums">
        {plural(data.local.length, "Local story", "Local stories")}
        <Dot />
        {plural(data.regional.length, "Regional story", "Regional stories")}
        <Dot />
        {plural(data.government.length, "Government update")}
        <span className="block font-normal normal-case tracking-normal text-ink-muted sm:ml-3 sm:inline">Last {data.windowHours} hours</span>
      </p>

      <div className="mt-6 grid gap-x-8 gap-y-8 lg:grid-cols-12">
        <Section
          id="local"
          title="Local stories"
          sub={`Reporting from ${regionLabel} that names ${shortName} or ${place.province}`}
          className="lg:col-span-8"
          empty={`No stories naming ${shortName} or ${place.province} ${span}.`}
          stories={data.local}
          lead
        />
        <Section
          id="government"
          title="Government updates"
          sub={`Government, state-run, and primary sources in ${regionLabel}`}
          className="lg:col-span-4"
          boxed
          empty={`No government updates from ${regionLabel} ${span}.`}
          stories={data.government}
        />
        <Section
          id="regional"
          title="Regional stories"
          sub={`Other stories with reporting from ${regionLabel}`}
          className="lg:col-span-8"
          empty={`No other stories from ${regionLabel} ${span}.`}
          stories={data.regional}
          columns
        />
        <div className="space-y-8 lg:col-span-4">
          <Section
            id="community"
            title="Community reports"
            sub="Hyperlocal papers, campus press, and radio"
            boxed
            empty={`No community reports from ${regionLabel} ${span}.`}
            stories={data.community}
          />
          <section aria-labelledby="sources-h" className="border border-ink p-4">
            <BoxHead id="sources-h" title="Local sources" />
            {data.sources.length ? (
              <ul className="divide-y divide-rule">
                {data.sources.map((s) => (
                  <li key={s.id} className="flex items-baseline justify-between gap-3 py-2">
                    <span className="block min-w-0">
                      <Link href={`/sources/${s.id}`} className="font-serif text-[16px] text-ink link-quiet">
                        {s.name}
                      </Link>
                      <span className="mt-0.5 block">
                        <SourceTypeBadge type={s.type} short />
                      </span>
                    </span>
                    <span className="meta shrink-0">{plural(s.articleCount, "article")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="meta">No sources in our index cover {regionLabel} yet.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

const Dot = () => (
  <span className="mx-2 text-ink-muted" aria-hidden>
    ·
  </span>
);

function BoxHead({ id, title, sub }: { id: string; title: string; sub?: string }) {
  return (
    <header className="mb-3">
      <div className="border-t-[3px] border-ink" />
      <div className="mt-[2px] border-t border-ink" />
      <h2 id={id} className="kicker mt-2 text-ink">
        {title}
      </h2>
      {sub && <p className="mt-0.5 font-serif text-[14px] italic text-ink-soft">{sub}</p>}
    </header>
  );
}

function Section({
  id,
  title,
  sub,
  stories,
  empty,
  className = "",
  boxed = false,
  lead = false,
  columns = false,
}: {
  id: string;
  title: string;
  sub: string;
  stories: StorySummary[];
  empty: string;
  className?: string;
  boxed?: boolean;
  lead?: boolean;
  columns?: boolean;
}) {
  const hid = `${id}-h`;
  return (
    <section aria-labelledby={hid} className={`${boxed ? "border border-ink p-4" : ""} ${className}`}>
      <BoxHead id={hid} title={`${title} (${stories.length})`} sub={sub} />
      {!stories.length ? (
        <p className="border-t border-rule pt-3 font-serif text-[15px] italic text-ink-muted">{empty}</p>
      ) : (
        <ul className={columns ? "grid gap-x-8 sm:grid-cols-2" : ""}>
          {stories.map((s, i) => (
            <li
              key={s.id}
              className={`border-t border-rule py-3 first:border-t-0 first:pt-0 ${columns ? "sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(2)]:pt-0" : ""}`}
            >
              <StoryCard story={s} variant={lead && i === 0 ? "standard" : "compact"} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
