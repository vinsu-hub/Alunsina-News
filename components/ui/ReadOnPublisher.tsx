import type { Source } from "@/lib/types";

/** Outbound link to the original publisher (§5A) — ALUNSINA never mirrors full text. */
export function ReadOnPublisher({ url, source, className = "" }: { url: string; source: Pick<Source, "name" | "paywalled">; className?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-sans text-xs font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
      >
        Read on {source.name} <span aria-hidden>↗</span>
      </a>
      {source.paywalled && <SubscriptionTag />}
    </span>
  );
}

export function SubscriptionTag() {
  return (
    <span className="border border-ochre px-1 py-px font-sans text-[10px] font-medium uppercase tracking-wide text-[#8a6a25]">
      Subscription required
    </span>
  );
}
