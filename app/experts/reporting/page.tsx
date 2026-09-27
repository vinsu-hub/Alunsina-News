import type { Metadata } from "next";
import Link from "next/link";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { ExpertTabs } from "@/components/pitches/ExpertTabs";
import { PitchList, PITCH_STATUS_LABELS } from "@/components/pitches/PitchList";
import { listPublicPitches, type PitchStatus } from "@/lib/queries/pitches";
import { REGIONS } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Reporting in Progress", description: "Follow verified journalists’ public pitches and self-reported reporting progress." };
const first = (value?: string | string[]) => Array.isArray(value) ? value[0] : value;
export default async function ReportingPage({ searchParams }: { searchParams: Promise<{ status?: string | string[]; region?: string | string[] }> }) {
  const query = await searchParams;
  const status = (["pitched", "in_progress", "published"] as PitchStatus[]).find((s) => s === first(query.status));
  const region = REGIONS.find((r) => r.id === first(query.region))?.id;
  const pitches = await listPublicPitches({ status, region, limit: 100 });
  function href(nextStatus?: string, nextRegion?: string) {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextRegion) params.set("region", nextRegion);
    return `/experts/reporting${params.size ? `?${params}` : ""}`;
  }
  const chip = (active: boolean) => `block whitespace-nowrap border px-3 py-2 font-sans text-xs focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? "border-forest bg-forest text-paper" : "border-rule hover:border-ink"}`;
  return <>
    <div className={CONTAINER}><PageHeader kicker="Explore · Experts & Commentary" title="Reporting in Progress" dek="Follow the questions journalists are pursuing, from pitch to publication." /></div>
    <ExploreSubNav active="experts" />
    <div className={`${CONTAINER} space-y-6 pt-4`}>
      <ExpertTabs active="reporting" />
      <div className="max-w-3xl font-sans text-sm leading-relaxed text-ink-soft"><p>Verified journalists post what they&apos;re reporting on. No topic needs approval; every post passes an automated safety screen (harassment, threats, doxxing), never a topic or viewpoint check.</p><Link href="/methodology#pitch-board" className="link-quiet mt-2 inline-block">How the Pitch Board works →</Link></div>
      <div className="min-w-0 space-y-4">
        <nav aria-label="Filter pitches by status"><p className="kicker mb-2">Status</p><ul className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap"><li className="shrink-0"><Link href={href(undefined, region)} aria-current={!status ? "page" : undefined} className={chip(!status)}>All statuses</Link></li>{Object.entries(PITCH_STATUS_LABELS).map(([value, label]) => <li key={value} className="shrink-0"><Link href={href(value, region)} aria-current={status === value ? "page" : undefined} className={chip(status === value)}>{label}</Link></li>)}</ul></nav>
        <nav aria-label="Filter pitches by region"><p className="kicker mb-2">Region</p><ul className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap"><li className="shrink-0"><Link href={href(status)} aria-current={!region ? "page" : undefined} className={chip(!region)}>All regions</Link></li>{REGIONS.map((r) => <li key={r.id} className="shrink-0"><Link href={href(status, r.id)} title={r.name} aria-current={region === r.id ? "page" : undefined} className={chip(region === r.id)}>{r.label}</Link></li>)}</ul></nav>
      </div>
      <section aria-labelledby="public-pitches"><div className="mb-3 flex items-baseline justify-between gap-4"><h2 id="public-pitches" className="section-head">Public pitches</h2><p className="meta">{pitches.length === 100 ? "Latest 100" : pitches.length} {pitches.length === 1 ? "pitch" : "pitches"}</p></div><PitchList pitches={pitches} empty={status || region ? "No public pitches match these filters. Try another status or region." : undefined} />{(status || region) && <Link href="/experts/reporting" className="link-quiet mt-4 inline-block font-sans text-sm">Clear filters →</Link>}</section>
    </div>
  </>;
}
