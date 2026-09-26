import type { Metadata } from "next";
import Link from "next/link";
import { CoverageChip } from "@/components/ui/CoverageChip";
import { StoryImage } from "@/components/ui/StoryImage";
import { Icon, StatusKicker } from "@/components/ui";
import { CONTAINER } from "@/components/explore/PageHeader";
import { search } from "@/lib/queries";
import { plural, timeAgo } from "@/lib/format";

const EXAMPLES = ["rice prices", "flood control", "Los Baños", "West Philippine Sea", "education reform"];

const qOf = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = qOf((await searchParams).q);
  return { title: q ? `Search: ${q}` : "Search" };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const q = qOf((await searchParams).q).slice(0, 200);
  const results = q ? (await search(q, 40)) : [];

  return (
    <div className={`${CONTAINER} max-w-[960px] pt-8 md:pt-10`}>
      <h1 className="headline text-4xl font-semibold md:text-5xl">Search stories</h1>
      <p className="mt-2 font-serif text-lg italic text-ink-soft">Results are stories, each compared across every source covering it.</p>

      <form action="/search" method="get" role="search" className="mt-6 flex border-b-2 border-ink">
        <label htmlFor="q" className="sr-only">
          Search stories
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Try a topic, place, or agency"
          className="min-w-0 flex-1 bg-transparent py-2 font-serif text-xl text-ink placeholder:text-ink-muted/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest md:text-2xl"
        />
        <button type="submit" className="flex shrink-0 items-center gap-1.5 px-2 font-sans text-sm font-semibold text-forest">
          <Icon name="search" />
          <span>Search</span>
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="meta mr-1">Try:</span>
        {EXAMPLES.map((e) => (
          <Link
            key={e}
            href={`/search?q=${encodeURIComponent(e)}`}
            className="border border-rule px-2 py-0.5 font-sans text-xs text-ink-soft hover:border-ink hover:text-ink"
          >
            {e}
          </Link>
        ))}
      </div>

      <section aria-live="polite" className="mt-10">
        {!q ? (
          <p className="border-t border-rule pt-4 font-serif italic text-ink-muted">
            Search headlines, summaries, and article excerpts across every source we read.
          </p>
        ) : results.length ? (
          <>
            <p className="kicker border-t-[3px] border-ink pt-2 text-ink">
              {plural(results.length, "story", "stories")} for &ldquo;{q}&rdquo;
            </p>
            <ol>
              {results.map((s) => (
                <li key={s.id} className="border-t border-rule py-4 first:border-t-0">
                  <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4"><StoryImage image={s.leadImage} alt={s.title} topic={s.topic} ratio="1/1" /><div className="min-w-0"><p className="flex flex-wrap items-center gap-x-3">
                    <span className="kicker text-ink-muted">Story</span>
                    <span className="kicker text-forest">{s.topic}</span>
                    <StatusKicker status={s.status} />
                  </p>
                  <h2 className="headline mt-1 text-xl leading-snug md:text-2xl">
                    <Link href={`/story/${s.id}`} className="decoration-1 underline-offset-4 hover:underline">
                      {s.title}
                    </Link>
                  </h2>
                  <CoverageChip storyId={s.id} stats={s.stats} variant="full" className="mt-1.5 flex-wrap" />
                  <p className="meta mt-0.5">
                    Latest update: <time dateTime={s.updatedAt}>{timeAgo(s.updatedAt)}</time>
                  </p></div></div>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className="border-t border-rule pt-4">
            <p className="headline text-xl">No stories found for &ldquo;{q}&rdquo;.</p>
            <p className="mt-2 font-serif text-ink-soft">
              Try a broader term, a place name, or browse by{" "}
              <Link href="/topics" className="link-quiet">topic</Link>,{" "}
              <Link href="/regions" className="link-quiet">region</Link>, or{" "}
              <Link href="/sources" className="link-quiet">source</Link>.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
