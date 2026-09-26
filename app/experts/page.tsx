import type { Metadata } from "next";
import Link from "next/link";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { ContributorList } from "@/components/contributors/ContributorList";
import { listContributors } from "@/lib/queries";
import { EXPERT_FIELDS } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Experts & Commentary" };
export default async function ExpertsPage({ searchParams }: { searchParams: Promise<{ field?: string | string[] }> }) {
  const raw = (await searchParams).field;
  const field = EXPERT_FIELDS.find((f) => f === (Array.isArray(raw) ? raw[0] : raw));
  const contributors = await listContributors({ kind: "expert", field });
  return <><div className={CONTAINER}><PageHeader kicker="Explore" title="Experts & Commentary" dek="Analysis — Not Reporting. Expertise and context, separate from the sources covering an event." /></div><ExploreSubNav active="experts" />
    <div className={`${CONTAINER} space-y-6 pt-6`}>
      <nav aria-label="Browse experts by field"><ul className="flex flex-wrap gap-2">{["All fields", ...EXPERT_FIELDS].map((f) => <li key={f}><Link href={f === "All fields" ? "/experts" : `/experts?field=${encodeURIComponent(f)}`} aria-current={(field ?? "All fields") === f ? "page" : undefined} className={`block border px-3 py-2 font-sans text-xs ${(field ?? "All fields") === f ? "border-forest bg-forest text-paper" : "border-rule hover:border-ink"}`}>{f}</Link></li>)}</ul></nav>
      <section aria-labelledby="contributors"><h2 id="contributors" className="section-head mb-3">Contributors{field ? ` · ${field}` : ""}</h2><ContributorList contributors={contributors} /></section>
      <p className="meta border-t border-rule pt-4">Commentary never counts as a reporting source. Sample profiles and commentary are fictional. <Link href="/methodology#contributors" className="link-quiet">How verification works →</Link></p>
      <Link href="/contribute" className="link-quiet font-sans text-sm">Become a contributor →</Link>
    </div></>;
}
