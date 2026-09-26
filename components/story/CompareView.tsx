"use client";
// Compare coverage (§20): the same story as told by different source types.
// Desktop: 2–3 side-by-side panes (4 at ≥1440px). Mobile: a swipeable sequence.
import Link from "next/link";
import { FlagButton } from "./FlagButton";
import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Icon, ReadOnPublisher, StoryImage, SourceTypeBadge } from "@/components/ui";
import { SOURCE_TYPE_COLORS, language, region, sourceType, type SourceTypeId } from "@/lib/taxonomy";
import type { Article, Emphasis } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { COMPARE_ORDER, dateTime } from "./util";

type Pane = { key: number; type: SourceTypeId; articleId: string };

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function CompareView({ articles, emphasis }: { articles: Article[]; emphasis: Emphasis[] }) {
  const types = COMPARE_ORDER.filter((t) => articles.some((a) => a.source.type === t));
  const ofType = (t: SourceTypeId) => articles.filter((a) => a.source.type === t);
  const points = (t: SourceTypeId) => emphasis.find((e) => e.sourceType === t)?.points ?? [];

  if (articles.length < 2)
    return (
      <div>
        <CompareHead />
        <p className="font-serif text-[15px] italic text-ink-soft">
          Only one article is linked to this story so far. Comparison needs at least two sources.
        </p>
      </div>
    );

  return (
    <div>
      <div className="hidden md:block">
        <DesktopCompare types={types} ofType={ofType} points={points} total={articles.length} />
      </div>
      <div className="md:hidden">
        <CompareHead />
        <MobileCompare types={types} ofType={ofType} points={points} />
      </div>
    </div>
  );
}

function CompareHead({ action }: { action?: ReactNode }) {
  return (
    <header className="section-head mb-4">
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <h2 className="kicker text-ink">Compare coverage</h2>
        {action}
      </div>
      <p className="mt-1 font-serif text-[15px] italic text-ink-soft">
        The same story, as reported by different kinds of sources. Pick a source type, then a publisher.
      </p>
    </header>
  );
}

/* ---------- desktop: side-by-side panes ---------- */

function DesktopCompare({
  types,
  ofType,
  points,
  total,
}: {
  types: SourceTypeId[];
  ofType: (t: SourceTypeId) => Article[];
  points: (t: SourceTypeId) => string[];
  total: number;
}) {
  const wide = useMedia("(min-width: 1440px)");
  const max = Math.min(wide ? 4 : 3, total);
  const make = (type: SourceTypeId, existing: Pane[]): Pane => {
    const used = existing.map((x) => x.articleId);
    const pick = ofType(type).find((a) => !used.includes(a.id)) ?? ofType(type)[0];
    const key = existing.reduce((m, x) => Math.max(m, x.key + 1), 0);
    return { key, type, articleId: pick.id };
  };
  const [panes, setPanes] = useState<Pane[]>(() => {
    const out: Pane[] = [];
    // Maximally different source types first; if the story has only one type, fill with its publishers.
    for (const t of [...types, ...types]) {
      if (out.length >= 2) break;
      const p = make(t, out);
      if (!out.some((x) => x.articleId === p.articleId)) out.push(p);
    }
    return out;
  });
  const visible = panes.slice(0, max);

  const add = () =>
    setPanes((ps) => {
      const shown = ps.slice(0, max);
      const usedTypes = shown.map((p) => p.type);
      const t = types.find((x) => !usedTypes.includes(x)) ?? types[0];
      return [...shown, make(t, ps)];
    });
  const update = (key: number, patch: Partial<Pane>) =>
    setPanes((ps) => ps.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  const remove = (key: number) => setPanes((ps) => ps.filter((p) => p.key !== key));

  return (
    <>
      <CompareHead
        action={
          <button
            type="button"
            onClick={add}
            disabled={visible.length >= max}
            className="shrink-0 border border-ink px-2.5 py-1 font-sans text-xs font-semibold text-ink hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-rule disabled:text-ink-muted disabled:hover:bg-transparent"
          >
            + Add pane
          </button>
        }
      />
      <div
        className="grid divide-x divide-rule"
        style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}
      >
        {visible.map((p, i) => {
          const list = ofType(p.type);
          const article = list.find((a) => a.id === p.articleId) ?? list[0];
          return (
            <div key={p.key} className={`min-w-0 [overflow-wrap:anywhere] ${i > 0 ? "pl-6" : ""} ${i < visible.length - 1 ? "pr-6" : ""}`}>
              <PanePickers
                index={i}
                types={types}
                type={p.type}
                articles={list}
                articleId={article.id}
                onType={(t) => update(p.key, { type: t, articleId: ofType(t)[0].id })}
                onArticle={(id) => update(p.key, { articleId: id })}
                onRemove={visible.length > 2 ? () => remove(p.key) : undefined}
              />
              <PaneBody article={article} points={points(p.type)} />
            </div>
          );
        })}
      </div>
    </>
  );
}

function PanePickers({
  index,
  types,
  type,
  articles,
  articleId,
  onType,
  onArticle,
  onRemove,
}: {
  index: number;
  types: SourceTypeId[];
  type?: SourceTypeId;
  articles: Article[];
  articleId: string;
  onType?: (t: SourceTypeId) => void;
  onArticle: (id: string) => void;
  onRemove?: () => void;
}) {
  const id = useId();
  const dupes = new Set(articles.map((a) => a.source.name).filter((n, i, all) => all.indexOf(n) !== i));
  const select =
    "w-full min-w-0 rounded-none border border-rule bg-paper px-2 py-1.5 font-sans text-xs text-ink hover:border-ink";
  return (
    <div className="mb-4 grid grid-cols-1 items-end gap-2 border-b border-rule pb-3">
      {onType && type && (
        <label className="min-w-0 flex-1" htmlFor={`${id}-type`}>
          <span className="meta mb-1 block">Pane {index + 1} · Source type</span>
          <select id={`${id}-type`} className={select} value={type} onChange={(e) => onType(e.target.value as SourceTypeId)}>
            {types.map((t) => (
              <option key={t} value={t}>
                {sourceType(t).label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="min-w-0 flex-1" htmlFor={`${id}-pub`}>
        <span className="meta mb-1 block">Publisher</span>
        <select
          id={`${id}-pub`}
          className={select}
          value={articleId}
          onChange={(e) => onArticle(e.target.value)}
          disabled={articles.length < 2}
        >
          {articles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.source.name}
              {dupes.has(a.source.name) ? ` · ${dateTime(a.publishedAt)}` : ""}
            </option>
          ))}
        </select>
      </label>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove pane ${index + 1}`}
          className="mb-0.5 p-1 text-ink-muted hover:text-ink"
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}

function PaneBody({ article: a, points }: { article: Article; points: string[] }) {
  const social = a.source.type === "social";
  return (
    <article
      className={`border-t-[3px] pt-3 ${social ? "bg-paper-deep/60 px-3 pb-3" : ""}`}
      style={{ borderColor: SOURCE_TYPE_COLORS[a.source.type] }}
    >
      <SourceTypeBadge type={a.source.type} />
      <p className="mt-2 font-sans text-sm font-semibold text-ink">
        <Link href={`/sources/${a.sourceId}`} className="hover:underline underline-offset-4">
          {a.source.name}
        </Link>
      </p>
      <p className="meta mt-0.5">Ownership: {a.source.ownership}</p>
      <p className="meta mt-0.5">
        <time dateTime={a.publishedAt} suppressHydrationWarning>
          {dateTime(a.publishedAt)} · {timeAgo(a.publishedAt)}
        </time>
      </p>
      {social && (
        <p className="mt-3 flex items-start gap-1.5 font-sans text-xs font-medium text-terracotta">
          <Icon name="alert" size={14} className="mt-px shrink-0" />
          Circulating online; not independently reported.
        </p>
      )}
      {a.imageUrl && <StoryImage image={{ url: a.imageUrl, credit: a.imageCredit ?? a.source.name }} alt={a.headline} className="mt-3 max-w-[260px]" />}
      <h3 className="headline mt-3 text-xl leading-snug md:text-[22px]">{a.headline}</h3>
      <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink-soft">{a.excerpt}</p>
      <p className="meta mt-3">
        {language(a.language).label}
        {a.region && <> · {region(a.region).label}</>}
      </p>
      <ReadOnPublisher url={a.url} source={a.source} className="mt-3" />
      <p className="mt-4 border-t border-rule pt-2 font-sans text-[11px] leading-relaxed text-ink-muted">
          <span className="font-semibold uppercase tracking-wide">What this type emphasizes:</span>{" "}
          {points.length ? points.join(" · ") : "Emphasis has not been summarized for this source type yet."}
      </p>
      <FlagButton kind="coverage_mismatch" storyId={a.storyId} targetId={a.id} />
    </article>
  );
}

/* ---------- mobile: swipeable sequence ---------- */

function MobileCompare({
  types,
  ofType,
  points,
}: {
  types: SourceTypeId[];
  ofType: (t: SourceTypeId) => Article[];
  points: (t: SourceTypeId) => string[];
}) {
  const [selectedTypes, setSelectedTypes] = useState<Partial<Record<number, SourceTypeId>>>({});
  const [picked, setPicked] = useState<Partial<Record<SourceTypeId, string>>>({});
  const [index, setIndex] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const n = types.length;

  const go = (i: number) => {
    const el = rail.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(n - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  };
  const onScroll = () => {
    const el = rail.current;
    if (el && el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div>
      <div
        ref={rail}
        onScroll={onScroll}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            go(index + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Coverage by source type"
        className="no-scrollbar grid snap-x snap-mandatory auto-cols-[100%] grid-flow-col overflow-x-auto overscroll-x-contain"
      >
        {types.map((defaultType, i) => {
          const t = selectedTypes[i] ?? defaultType;
          const list = ofType(t);
          const article = list.find((a) => a.id === picked[t]) ?? list[0];
          return (
            <div
              key={defaultType}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}: ${sourceType(t).label}`}
              className="min-w-0 snap-start px-px [overflow-wrap:anywhere]"
            >
              <PanePickers
                index={i}
                types={types}
                type={t}
                onType={(next) => setSelectedTypes((current) => ({ ...current, [i]: next }))}
                articles={list}
                articleId={article.id}
                onArticle={(id) => setPicked((p) => ({ ...p, [t]: id }))}
              />
              <PaneBody article={article} points={points(t)} />
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-rule pt-3">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous source type"
          className="border border-ink p-1.5 text-ink disabled:border-rule disabled:text-rule"
        >
          <Icon name="arrow" size={16} className="rotate-180" />
        </button>
        <div className="flex flex-col items-center gap-1.5">
          <span className="meta" aria-live="polite">
            {index + 1} of {n} · {sourceType(selectedTypes[index] ?? types[index] ?? types[0]).short}
          </span>
          <span className="flex gap-1.5">
            {types.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${sourceType(t).label}`}
                aria-current={i === index ? "true" : undefined}
                className="p-1"
              >
                <span
                  className="block size-2 border"
                  style={{ background: i === index ? SOURCE_TYPE_COLORS[t] : "transparent", borderColor: SOURCE_TYPE_COLORS[t] }}
                />
              </button>
            ))}
          </span>
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === n - 1}
          aria-label="Next source type"
          className="border border-ink p-1.5 text-ink disabled:border-rule disabled:text-rule"
        >
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  );
}
