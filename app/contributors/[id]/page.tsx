import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { SectionHead } from "@/components/ui";
import { getContributor } from "@/lib/queries";
import { getPitchesForContributor } from "@/lib/queries/pitches";
import { PitchList } from "@/components/pitches/PitchList";
import { timeAgo } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getContributor((await params).id);
  return { title: c?.name ?? "Contributor not found" };
}
export default async function ContributorPage({ params }: Props) {
  const c = await getContributor((await params).id);
  if (!c) notFound();
  const pitches = c.kind === "journalist" ? await getPitchesForContributor(c.id) : [];
  return <><div className={CONTAINER}><PageHeader kicker={<Link href="/experts" className="link-quiet">Contributors · {c.kind === "expert" ? "Expert" : "Independent Journalist"}</Link>} title={c.name} dek={c.credentials} aside={c.isSample ? "Sample profile" : undefined} /></div><ExploreSubNav active="experts" />
    <div className={`${CONTAINER} grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]`}>
      <aside className="min-w-0 space-y-6"><section aria-labelledby="profile"><SectionHead id="profile" title="Contributor profile" /><dl className="divide-y divide-rule font-sans text-sm">
        <div className="py-3"><dt className="kicker">Kind</dt><dd>{c.kind === "expert" ? "Expert" : "Independent Journalist"}</dd></div>
        {c.field && <div className="py-3"><dt className="kicker">Field</dt><dd>{c.field}</dd></div>}
        <div className="py-3"><dt className="kicker">Credentials</dt><dd>{c.credentials}</dd></div>
        <div className="py-3"><dt className="kicker">{c.kind === "journalist" ? "Portfolio / byline history" : "Affiliation"}</dt><dd>{c.kind === "journalist" ? c.portfolioUrl ? <a href={c.portfolioUrl} target="_blank" rel="noopener noreferrer" className="link-quiet break-words">View portfolio ↗</a> : "Portfolio not provided" : c.affiliation ?? "No affiliation declared"}</dd></div>
      </dl></section>
      <section className="border-l-2 border-ochre bg-paper-deep p-4" aria-labelledby="conflicts"><h2 id="conflicts" className="section-head">Declared conflicts of interest</h2><ul className="mt-3 space-y-2 font-sans text-sm">{(c.conflicts.length ? c.conflicts : ["None declared"]).map((conflict) => <li key={conflict}>{conflict}</li>)}</ul></section>
      <p className="font-sans text-sm text-ink-soft">Verified for identity and expertise, not viewpoint. <Link href="/methodology#contributors" className="link-quiet">Verification process →</Link>{c.isSample && " This fictional sample profile does not represent a verified real person."}</p></aside>
      <div className="min-w-0 space-y-8"><p className="font-serif text-lg text-ink-soft">{c.bio}</p>{c.kind === "journalist" && <section aria-labelledby="reporting"><SectionHead id="reporting" title="Reporting in progress" sub="Public pitches and progress, self-reported by this journalist." action={<Link href="/experts/reporting" className="link-quiet">View the Pitch Board →</Link>} /><PitchList pitches={pitches} /></section>}<section aria-labelledby="history"><SectionHead id="history" title="Contribution history" sub="Analysis — Not Reporting. Commentary never counts as a source." />{c.commentary.length ? <ul>{c.commentary.map((item) => <li key={item.id} className="border-t border-rule py-4"><p className="kicker text-forest">{item.label}{item.isSample && " · Sample commentary"}</p><h3 className="headline mt-2 text-2xl"><Link href={`/story/${item.storyId}#commentary`} className="link-quiet">{item.title}</Link></h3><p className="meta mt-2"><time dateTime={item.publishedAt}>{timeAgo(item.publishedAt)}</time> · <Link href={`/story/${item.storyId}`} className="link-quiet">View story →</Link></p></li>)}</ul> : <p className="font-serif italic text-ink-muted">No published contributions yet.</p>}</section></div>
    </div></>;
}
