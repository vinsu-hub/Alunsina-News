import { topicSlug } from "@/lib/taxonomy";

/**
 * Publisher photo from the RSS item (hotlinked, never re-hosted) with a
 * mandatory "Photo: [Publisher]" credit, or a typographic topic placeholder.
 * See docs/DECISIONS.md → Images.
 */
export function StoryImage({
  image,
  alt,
  topic,
  ratio = "16/9",
  showCredit = true,
  className = "",
  priority = false,
}: {
  image: { url: string; credit: string } | null | undefined;
  alt: string;
  topic?: string;
  ratio?: "16/9" | "4/3" | "1/1" | "3/2";
  showCredit?: boolean;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={className}>
      <div
        className="relative w-full overflow-hidden bg-paper-deep"
        style={{ aspectRatio: ratio }}
      >
        {image?.url ? (
          // Remote publisher images vary by host; a plain <img> avoids allow-listing every domain.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Placeholder topic={topic} />
        )}
      </div>
      {showCredit && image?.url && (
        <figcaption className="mt-1 font-sans text-[10px] uppercase tracking-wide text-ink-muted">
          Photo: {image.credit}
        </figcaption>
      )}
    </figure>
  );
}

function Placeholder({ topic }: { topic?: string }) {
  return (
    <div
      aria-hidden
      data-topic={topic ? topicSlug(topic) : undefined}
      className="absolute inset-0 flex items-end bg-paper-deep p-3"
    >
      {topic && <span className="kicker text-ink-muted/80">{topic}</span>}
    </div>
  );
}
