import Link from "next/link";
import { listAdminEditions } from "@/lib/queries/admin";
import { Heading } from "@/components/admin/Fields";
import type { Subscores } from "@/ingest/placement";

function Signals({ value }: { value: Subscores }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-5">{Object.entries(value).map(([key,n]) => <div key={key}><dt className="capitalize text-ink-muted">{key}</dt><dd>{n.toFixed(4)}</dd></div>)}</dl>;
}
export default async function Editions() {
  const editions = await listAdminEditions();
  return <>
    <Heading title="Editions">Read-only review of reporting scores and frozen placements. All five signals have equal weight; engagement is never used.</Heading>
    {!editions.length && <p>No editorial editions yet. The first ingest creates one; subsequent editions begin at 06:00 and 18:00 Asia/Manila.</p>}
    {editions.map(edition => <section key={edition.id} className="admin-panel my-6 min-w-0">
      <h2 className="font-serif text-2xl">{edition.window_label}</h2>
      <p className="meta">Computed {new Date(edition.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })} Asia/Manila</p>
      <h3 className="mt-4 font-serif text-xl">Frozen placements</h3>
      {edition.placements.map(p => <article className="admin-row" key={`${p.slot}-${p.rank}`}>
        <p className="kicker">{p.slot} · Rank {p.rank} · Total {p.score.toFixed(4)}</p>
        <Link className="break-words" href={`/story/${p.story_id}`}>{p.title} ↗</Link>
        <Signals value={p.subscores}/>
      </article>)}
      <h3 className="mt-6 font-serif text-xl">Computed vs placed</h3>
      <p className="meta">Every eligible candidate at this run, including those outside the placement slots. Scores are retained for 60 days; frozen placements remain available.</p>
      {!edition.scores.length && <p>No retained candidate scores for this edition.</p>}
      {edition.scores.map((s,i) => <article className="admin-row" key={s.story_id}>
        <p className="kicker">Computed rank {i+1} · Total {s.score.toFixed(4)}{s.hidden ? ' · Hidden' : ''}</p>
        <p className="break-words">{s.title}</p><p className="meta">{s.slots.length ? s.slots.join(' · ') : 'Not placed'}</p>
        <Signals value={s.subscores}/>
      </article>)}
    </section>)}
  </>;
}
