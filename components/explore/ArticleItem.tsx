import Link from "next/link";
import { ReadOnPublisher, SourceTypeBadge } from "@/components/ui";
import { language } from "@/lib/taxonomy";
import type { Article } from "@/lib/types";
import { timeAgo } from "@/lib/format";

/** Headline + short excerpt + "Read on [Publisher] ↗". Never full text (§5A). */
export function ArticleItem({ a, showSource = true }: { a: Article; showSource?: boolean }) {
  return (
    <article className="border-t border-rule py-3">
      {showSource && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <SourceTypeBadge type={a.source.type} short />
          <Link href={`/sources/${a.source.id}`} className="link-quiet font-sans text-xs font-semibold text-ink">
            {a.source.name}
          </Link>
        </p>
      )}
      <h3 className="headline mt-1 text-[17px] leading-snug">{a.headline}</h3>
      {a.excerpt && (
        <p className="mt-1 line-clamp-2 font-serif text-[15px] leading-relaxed text-ink-soft">{a.excerpt}</p>
      )}
      <p className="meta mt-1.5">
        <time dateTime={a.publishedAt}>{timeAgo(a.publishedAt)}</time> · {language(a.language).label}
        {a.storyId && (
          <>
            {" · "}
            <Link href={`/story/${a.storyId}`} className="link-quiet">
              See the full story
            </Link>
          </>
        )}
      </p>
      <ReadOnPublisher url={a.url} source={a.source} className="mt-1.5" />
    </article>
  );
}
