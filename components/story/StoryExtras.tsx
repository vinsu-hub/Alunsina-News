import Link from "next/link";
import { CoverageChip } from "@/components/ui";
import type { Commentary, RelatedStory } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { FlagButton } from "./FlagButton";

export function ExpertCommentary({ items }: { items: Commentary[] }) {
  if (!items.length) return <p className="font-serif text-ink-soft">No expert commentary on this story yet. <Link href="/contribute" className="text-forest underline">Contribute analysis →</Link></p>;
  return <div className="space-y-5">{items.map((item) => <article key={item.id} className="border-l-[3px] border-ochre bg-paper-deep p-4 md:p-5">
    <p className="kicker text-ink">Analysis — Not Reporting</p>
    {(item.isSample || item.contributor.isSample) && <p className="meta mt-1">Sample commentary · Fictional contributor</p>}
    <h3 className="headline mt-3 text-2xl">{item.title}</h3>
    <p className="mt-2 font-sans text-sm"><Link href={`/contributors/${item.contributorId}`} className="font-semibold underline underline-offset-4">{item.contributor.name}</Link> · {item.contributor.credentials}</p>
    <p className="meta mt-1">Affiliation: {item.contributor.affiliation ?? "None declared"}</p>
    <p className="mt-2 font-sans text-xs text-ink-soft">{item.contributor.conflicts.length ? `Declared conflicts: ${item.contributor.conflicts.join("; ")}` : "No conflicts declared"}</p>
    <p className="mt-4 whitespace-pre-line font-serif text-base leading-relaxed">{item.body}</p>
    <time dateTime={item.publishedAt} className="meta mt-3 block">{new Date(item.publishedAt).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium" })}</time>
  </article>)}</div>;
}
export function RelatedStories({ items, storyId }: { items: RelatedStory[]; storyId: string }) {
  const ordered = items.filter((item) => item.confidence >= 0.6).toSorted((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  if (!ordered.length) return <p className="font-serif italic text-ink-muted">No related stories identified yet.</p>;
  return <ol className="divide-y divide-rule border-l border-rule pl-4">{ordered.map((item) => <li key={item.id} className="py-4 first:pt-0">
    <p className="meta">{item.relation === "earlier" ? `← ${timeAgo(item.updatedAt)}` : item.relation === "developing" ? "→ Developing" : `→ ${timeAgo(item.updatedAt)}`}</p>
    <h3 className="headline mt-1 text-xl"><Link href={`/story/${item.id}`} className="link-quiet">{item.title}</Link></h3>
    <CoverageChip storyId={item.id} stats={item.stats} className="mt-2" />
    <FlagButton kind="related_mismatch" storyId={storyId} targetId={item.id} />
  </li>)}</ol>;
}
