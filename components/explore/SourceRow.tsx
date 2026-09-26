import Link from "next/link";
import { SourceTypeBadge, SubscriptionTag } from "@/components/ui";
import { dataStatus, language, region } from "@/lib/taxonomy";
import type { Source } from "@/lib/types";
import { plural } from "@/lib/format";

/** One line of the source index: name, type, ownership, data status, regions, languages, count. */
export function SourceRow({ s }: { s: Source & { articleCount: number } }) {
  return (
    <li className="grid gap-x-6 gap-y-1.5 border-t border-rule py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.4fr)_5.5rem]">
      <div className="min-w-0">
        <Link
          href={`/sources/${s.id}`}
          className="headline text-lg font-semibold leading-snug decoration-1 underline-offset-4 hover:underline"
        >
          {s.name}
        </Link>
        <div className="mt-0.5">
          <SourceTypeBadge type={s.type} />
        </div>
      </div>
      <p className="min-w-0 font-sans text-[13px] text-ink-soft">
        <span className="kicker mr-1.5 text-[10px] text-ink-muted md:hidden">Ownership</span>
        {s.ownership}
      </p>
      <div className="min-w-0 font-sans text-[13px] text-ink-soft">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-ink">{dataStatus(s.dataStatus).label}</span>
          {s.paywalled && <SubscriptionTag />}
        </p>
        <p className="meta mt-0.5">
          {s.regions.length ? s.regions.map((r) => region(r).label).join(", ") : "No fixed region"} ·{" "}
          {s.languages.map((l) => language(l).label).join(", ")}
        </p>
      </div>
      <p className="meta md:text-right">{plural(s.articleCount, "article")}</p>
    </li>
  );
}
