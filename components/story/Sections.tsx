// Server-rendered story sections (§20, §21). Interactive islands live in their own files.
import Link from "next/link";
import { Icon, SourceTypeBadge } from "@/components/ui";
import { SOURCE_TYPES, SOURCE_TYPE_COLORS, blindspotType, language } from "@/lib/taxonomy";
import type { Angle, Article, Blindspot, Evidence, FactCheck, StoryDetail, TimelineEvent } from "@/lib/types";
import { clockTime, pct, plural, shortDate, timeAgo } from "@/lib/format";
import { dateTime, dayLabel, manilaDayKey } from "./util";

/* ---------- section wrapper ---------- */

export function Section({
  id,
  title,
  sub,
  action,
  children,
  className = "",
}: {
  id?: string;
  title: string;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const hid = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={hid} className={`scroll-mt-4 ${className}`}>
      <header className="section-head mb-4">
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <h2 id={hid} className="kicker text-ink">
            {title}
          </h2>
          {action && <div className="meta shrink-0">{action}</div>}
        </div>
        {sub && <div className="mt-1 font-serif text-[15px] italic text-ink-soft">{sub}</div>}
      </header>
      {children}
    </section>
  );
}

/* ---------- What Happened ---------- */

export function WhatHappened({ story, since }: { story: StoryDetail; since: string | null }) {
  return (
    <Section id="summary" title="What happened" sub="A summary of the reporting below — not original ALUNSINA NEWS reporting.">
      <p className="font-serif text-xl leading-relaxed text-ink md:text-[22px] md:leading-[1.55]">{story.summary}</p>
      <p className="meta mt-3">
        Reported by <strong className="font-semibold text-ink">{plural(story.stats.sources, "source")}</strong>
        {since && (
          <>
            {" "}
            since <time dateTime={since}>{dateTime(since)}</time> Manila time
          </>
        )}
        {" · "}
        <a href="#sources" className="link-quiet">
          See all {plural(story.stats.articles, "article")}
        </a>
      </p>
    </Section>
  );
}

/* ---------- Timeline (§21) ---------- */

export function Timeline({ events, articles }: { events: TimelineEvent[]; articles: Article[] }) {
  if (!events.length) return <p className="meta">No timeline yet.</p>;
  const ids = new Set(articles.map((a) => a.id));
  const multiDay = new Set(events.map((e) => manilaDayKey(e.at))).size > 1;
  return (
    <ol className="relative">
      {events.map((e, i) => {
        const newDay = multiDay && (i === 0 || manilaDayKey(e.at) !== manilaDayKey(events[i - 1].at));
        const linked = e.articleId && ids.has(e.articleId);
        return (
          <li key={`${e.at}-${i}`}>
            {newDay && <p className="kicker mb-2 mt-1 text-ink-muted">{dayLabel(e.at)}</p>}
            <div className="grid grid-cols-[3rem_1fr] gap-x-3">
              <time dateTime={e.at} className="pt-0.5 text-right font-sans text-xs font-semibold tabular-nums text-ink">
                {clockTime(e.at)}
              </time>
              <div className="relative border-l border-rule pb-4 pl-4">
                <span
                  className="absolute -left-[5px] top-[0.35rem] size-[9px]"
                  style={{ background: e.sourceType ? SOURCE_TYPE_COLORS[e.sourceType] : "var(--ink-muted)" }}
                  aria-hidden
                />
                <p className="font-serif text-[16px] leading-snug text-ink">
                  {linked ? (
                    <a href={`#article-${e.articleId}`} className="link-quiet">
                      {e.label}
                    </a>
                  ) : (
                    e.label
                  )}
                </p>
                {e.sourceType && <SourceTypeBadge type={e.sourceType} short className="mt-0.5" />}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Languages + publishers by type ---------- */

export function LanguageBars({ languages }: { languages: StoryDetail["languages"] }) {
  const total = languages.reduce((a, l) => a + l.articles, 0) || 1;
  return (
    <ul className="space-y-2">
      {languages.map((l) => (
        <li key={l.language}>
          <div className="flex items-baseline justify-between gap-3 font-sans text-[13px]">
            <span className="text-ink-soft">{language(l.language).label}</span>
            <span className="meta">
              {plural(l.articles, "article")} · {pct(l.articles / total)}
            </span>
          </div>
          <span className="mt-1 block h-1 bg-rule/50" aria-hidden>
            <span className="block h-full bg-forest" style={{ width: `${Math.max(1, (l.articles / total) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PublishersByType({ articles }: { articles: Article[] }) {
  const rows = SOURCE_TYPES.map((t) => {
    const pubs = [...new Set(articles.filter((a) => a.source.type === t.id).map((a) => a.source.name))];
    return { t, pubs };
  }).filter((r) => r.pubs.length);
  return (
    <dl className="divide-y divide-rule border-y border-rule">
      {rows.map(({ t, pubs }) => (
        <div key={t.id} className="grid grid-cols-[7.5rem_1fr] gap-3 py-2">
          <dt>
            <SourceTypeBadge type={t.id} short />
            <span className="meta block pl-3.5">{plural(pubs.length, "publisher")}</span>
          </dt>
          <dd className="font-sans text-[13px] leading-snug text-ink-soft">{pubs.join(", ")}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Coverage angles ---------- */

export function Angles({ angles }: { angles: Angle[] }) {
  if (!angles.length) return <p className="meta">Coverage angles have not been summarized for this story yet.</p>;
  return (
    <ul className="space-y-3">
      {angles.map((a) => (
        <li key={a.angle}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans text-sm font-semibold text-ink">{a.angle}</span>
            <span className="font-sans text-sm tabular-nums text-ink">{pct(a.share)}</span>
          </div>
          <span className="mt-1 block h-2 bg-rule/40" aria-hidden>
            <span className="block h-full bg-ochre" style={{ width: `${Math.max(1, a.share * 100)}%` }} />
          </span>
          {a.note && <p className="meta mt-1">{a.note}</p>}
        </li>
      ))}
      <li className="meta pt-1">Share of this story&rsquo;s articles whose main focus is each angle.</li>
    </ul>
  );
}

/* ---------- Evidence / primary sources ---------- */

const EVIDENCE_KINDS: { id: Evidence["kind"]; label: string }[] = [
  { id: "document", label: "Documents" },
  { id: "statement", label: "Official statements" },
  { id: "dataset", label: "Datasets" },
  { id: "study", label: "Studies" },
  { id: "report", label: "Reports" },
];

export function EvidenceList({ evidence, factChecks }: { evidence: Evidence[]; factChecks: FactCheck[] }) {
  const groups = EVIDENCE_KINDS.map((k) => ({ ...k, items: evidence.filter((e) => e.kind === k.id) })).filter(
    (g) => g.items.length,
  );
  return (
    <div className="space-y-5">
      {groups.length === 0 ? (
        <p className="border-l-2 border-ochre pl-3 font-serif text-[15px] italic text-ink-soft">
          No primary documents linked yet. Reports on this story have not pointed to an underlying document, dataset, or
          official statement we could verify.
        </p>
      ) : (
        groups.map((g) => (
          <div key={g.id}>
            <h3 className="kicker mb-1 text-ink-muted">{g.label}</h3>
            <ul className="divide-y divide-rule border-y border-rule">
              {g.items.map((e) => (
                <li key={e.url + e.title} className="flex gap-3 py-2.5">
                  <Icon name="doc" size={20} className="mt-0.5 shrink-0 text-forest" />
                  <div className="min-w-0">
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-[16px] leading-snug text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
                    >
                      {e.title} <span aria-hidden>↗</span>
                    </a>
                    <p className="meta mt-0.5">
                      {e.publisher}
                      {e.publishedAt && (
                        <>
                          {" · "}
                          <time dateTime={e.publishedAt}>{shortDate(e.publishedAt)}</time>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      {factChecks.length > 0 && (
        <div>
          <h3 className="kicker mb-1 text-ink-muted">Fact-checks</h3>
          <ul className="divide-y divide-rule border-y border-rule">
            {factChecks.map((f) => (
              <li key={f.url} className="py-2.5">
                <p className="font-serif text-[16px] leading-snug text-ink">Claim: &ldquo;{f.claim}&rdquo;</p>
                <p className="mt-1 font-sans text-[13px] text-ink-soft">
                  {f.rating ? (
                    <>
                      Rated <strong className="font-semibold text-ink">&lsquo;{f.rating}&rsquo;</strong> by {f.org}
                    </>
                  ) : (
                    <>Checked by {f.org}</>
                  )}
                  {" · "}
                  <time dateTime={f.publishedAt}>{shortDate(f.publishedAt)}</time>
                  {" · "}
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-forest link-quiet">
                    Read the fact-check <span aria-hidden>↗</span>
                  </a>
                </p>
                <p className="meta mt-0.5">The rating is the fact-checker&rsquo;s own, quoted as published.</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Potential blindspots ---------- */

export function Blindspots({ blindspots }: { blindspots: Blindspot[] }) {
  return (
    <div>
      {blindspots.length === 0 ? (
        <p className="font-serif text-[15px] italic text-ink-soft">No potential blindspots detected for this story right now.</p>
      ) : (
        <ul className="space-y-4">
          {blindspots.map((b) => (
            <li key={b.id} className="border-l-2 border-terracotta pl-3">
              <p className="kicker text-terracotta">Potential {blindspotType(b.type).label} Blindspot</p>
              <p className="mt-1 font-serif text-[16px] leading-snug text-ink">{b.example}</p>
              <p className="mt-1.5 font-sans text-[13px] leading-snug text-ink-soft">
                <span className="font-semibold text-ink">Why this was flagged:</span> {b.reason}
              </p>
              {b.type === "social" && (
                <p className="mt-1.5 font-sans text-[13px] leading-snug text-ink-soft">
                  ALUNSINA NEWS does not rate this claim as true or false. This flag means independent verification is
                  thin so far.
                </p>
              )}
              <p className="meta mt-1.5">
                Detected <time dateTime={b.detectedAt}>{dateTime(b.detectedAt)}</time> ({timeAgo(b.detectedAt)})
                {b.linkHref && b.linkLabel && (
                  <>
                    {" · "}
                    <a href={b.linkHref} className="font-semibold text-forest link-quiet">
                      {b.linkLabel} →
                    </a>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="meta mt-4 border-t border-rule pt-2">
        Potential blindspots are automated signals, not conclusions.{" "}
        <Link href="/methodology#blindspots" className="font-semibold text-forest link-quiet">
          How we detect them →
        </Link>
      </p>
    </div>
  );
}

/* ---------- Sidebar summary ---------- */

export function SidebarSummary({ story }: { story: StoryDetail }) {
  const top = [...story.coverage].sort((a, b) => b.articles - a.articles);
  const jumps: [string, string][] = [
    ["#summary", "What happened"],
    ["#timeline", "Timeline"],
    ["#coverage", "Coverage"],
    ["#emphasis", "What sources emphasize"],
    ["#angles", "Coverage angles"],
    ["#evidence", "Evidence"],
    ["#sources", `Source list (${story.stats.articles})`],
    ["#blindspots", `Potential blindspots (${story.blindspots.length})`],
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="kicker border-b border-ink pb-1 text-ink">At a glance</h2>
        <dl className="mt-2 grid grid-cols-2 gap-y-2 font-sans text-[13px]">
          <dt className="text-ink-muted">Sources</dt>
          <dd className="text-right font-semibold tabular-nums">{story.stats.sources}</dd>
          <dt className="text-ink-muted">Articles</dt>
          <dd className="text-right font-semibold tabular-nums">{story.stats.articles}</dd>
          <dt className="text-ink-muted">Regions</dt>
          <dd className="text-right font-semibold tabular-nums">{story.stats.regions}</dd>
          <dt className="text-ink-muted">Languages</dt>
          <dd className="text-right font-semibold tabular-nums">{story.stats.languages}</dd>
          <dt className="text-ink-muted">Primary documents</dt>
          <dd className="text-right font-semibold tabular-nums">{story.evidence.length}</dd>
        </dl>
        <p className="meta mt-3">
          {top
            .filter((c) => c.articles > 0)
            .map((c) => `${c.island[0].toUpperCase()}${c.island.slice(1)} ${pct(c.share)}`)
            .join(" · ") || "No region-tagged reporting yet"}
        </p>
      </div>
      {story.blindspots.length > 0 && (
        <div>
          <h2 className="kicker border-b border-ink pb-1 text-terracotta">Potential blindspots</h2>
          <ul className="mt-2 space-y-2">
            {story.blindspots.map((b) => (
              <li key={b.id} className="font-sans text-[13px] leading-snug">
                <a href="#blindspots" className="hover:underline underline-offset-4">
                  <span className="font-semibold">{blindspotType(b.type).label}:</span>{" "}
                  <span className="text-ink-soft">{b.example}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <nav aria-label="On this page">
        <h2 className="kicker border-b border-ink pb-1 text-ink">On this page</h2>
        <ul className="mt-2 space-y-1.5">
          {jumps.map(([href, label]) => (
            <li key={href}>
              <a href={href} className="font-sans text-[13px] text-ink-soft hover:text-ink hover:underline underline-offset-4">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
