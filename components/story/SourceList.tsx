"use client";
// Every article in the story, grouped by source type (§20, §22 ownership).
import Link from "next/link";
import { useState } from "react";
import { ReadOnPublisher, SourceTypeBadge } from "@/components/ui";
import { SOURCE_TYPE_IDS, dataStatus, language, region, sourceType, type LanguageId, type SourceTypeId } from "@/lib/taxonomy";
import type { Article } from "@/lib/types";
import { plural, timeAgo } from "@/lib/format";
import { dateTime, groupByType } from "./util";

const MOBILE_PREVIEW = 5;

export function SourceList({ articles }: { articles: Article[] }) {
  const [type, setType] = useState<SourceTypeId | null>(null);
  const [lang, setLang] = useState<LanguageId | null>(null);
  const [expanded, setExpanded] = useState(false);

  const types = SOURCE_TYPE_IDS.filter((t) => articles.some((a) => a.source.type === t));
  const langs = [...new Set(articles.map((a) => a.language))];
  const filtered = articles.filter((a) => (!type || a.source.type === type) && (!lang || a.language === lang));
  const groups = groupByType(filtered);
  // Offset of each group's first article in the flat list (for the mobile preview cut-off).
  const starts = groups.map((_, i) => groups.slice(0, i).reduce((n, g) => n + g.articles.length, 0));

  return (
    <div>
      <div className="mb-5 space-y-2">
        <ChipRow label="Source type">
          <Chip on={!type} onClick={() => setType(null)}>
            All types
          </Chip>
          {types.map((t) => (
            <Chip key={t} on={type === t} onClick={() => setType(type === t ? null : t)}>
              {sourceType(t).short}
            </Chip>
          ))}
        </ChipRow>
        {langs.length > 1 && (
          <ChipRow label="Language">
            <Chip on={!lang} onClick={() => setLang(null)}>
              All languages
            </Chip>
            {langs.map((l) => (
              <Chip key={l} on={lang === l} onClick={() => setLang(lang === l ? null : l)}>
                {language(l).label}
              </Chip>
            ))}
          </ChipRow>
        )}
        <p className="meta" aria-live="polite">
          Showing {plural(filtered.length, "article")}
          {filtered.length !== articles.length && ` of ${articles.length}`}
        </p>
      </div>

      {groups.length === 0 && <p className="meta">No articles match these filters.</p>}

      <div className="space-y-6">
        {groups.map((g, gi) => {
          const start = starts[gi];
          const groupHidden = !expanded && start >= MOBILE_PREVIEW;
          return (
            <section key={g.type} className={groupHidden ? "hidden md:block" : ""} aria-label={sourceType(g.type).label}>
              <h3 className="flex items-baseline justify-between border-b border-ink pb-1">
                <SourceTypeBadge type={g.type} className="text-ink" />
                <span className="meta">{plural(g.articles.length, "article")}</span>
              </h3>
              <ul className="divide-y divide-rule">
                {g.articles.map((a, i) => (
                  <li
                    key={a.id}
                    id={`article-${a.id}`}
                    className={`scroll-mt-4 py-4 ${!expanded && start + i >= MOBILE_PREVIEW ? "hidden md:block" : ""}`}
                  >
                    <ArticleItem article={a} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {filtered.length > MOBILE_PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="mt-4 w-full border border-ink py-2 font-sans text-xs font-semibold uppercase tracking-wide text-ink md:hidden"
        >
          {expanded ? "Show fewer articles" : `Show all ${filtered.length} articles`}
        </button>
      )}
    </div>
  );
}

function ArticleItem({ article: a }: { article: Article }) {
  const social = a.source.type === "social";
  return (
    <article className={social ? "border-l-2 border-terracotta pl-3" : ""}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <Link href={`/sources/${a.sourceId}`} className="font-sans text-sm font-semibold text-ink hover:underline underline-offset-4">
          {a.source.name}
        </Link>
        <span className="meta">
          <time dateTime={a.publishedAt} title={dateTime(a.publishedAt)} suppressHydrationWarning>
            {timeAgo(a.publishedAt)}
          </time>
        </span>
      </div>
      <p className="mt-0.5 font-sans text-[11px] leading-snug text-ink-muted">
        Ownership: {a.source.ownership}
        <span className="mx-1.5 text-rule" aria-hidden>
          |
        </span>
        <span className="uppercase tracking-wide">{dataStatus(a.source.dataStatus).label}</span>
      </p>
      {social && (
        <p className="mt-2 font-sans text-xs font-medium text-terracotta">Circulating online; not independently reported.</p>
      )}
      <h4 className="headline mt-2 text-lg leading-snug">{a.headline}</h4>
      {a.excerpt && <p className="mt-1 font-serif text-[15px] leading-relaxed text-ink-soft">{a.excerpt}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex flex-wrap gap-1">
          <Tag>{language(a.language).label}</Tag>
          {a.region && <Tag>{region(a.region).label}</Tag>}
        </span>
        <ReadOnPublisher url={a.url} source={a.source} />
      </div>
    </article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="border border-rule px-1.5 py-px font-sans text-[11px] text-ink-soft">{children}</span>;
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={`Filter by ${label.toLowerCase()}`} className="flex flex-wrap items-center gap-1.5">
      <span className="meta mr-1 w-full sm:w-auto">{label}</span>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`border px-2 py-0.5 font-sans text-xs ${
        on ? "border-ink bg-ink text-paper" : "border-rule text-ink-soft hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
