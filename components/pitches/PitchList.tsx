import Link from "next/link";
import type { PublicPitch, PitchStatus } from "@/lib/queries/pitches";

export const PITCH_STATUS_LABELS: Record<PitchStatus, string> = { pitched: "Pitched", in_progress: "In Progress", published: "Published" };
const date = (iso: string) => new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
function elapsed(iso: string) {
  const day = (value: string | number) => Math.floor((new Date(value).getTime() + 8 * 3600000) / 86400000);
  const days = Math.max(0, day(Date.now()) - day(iso));
  return days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
}

export function PitchList({ pitches, empty = "No public pitches yet. Reporting will appear here after automated safety screening." }: { pitches: PublicPitch[]; empty?: string }) {
  if (!pitches.length) return <p className="border-y border-rule py-8 font-serif text-lg italic text-ink-muted">{empty}</p>;
  return <ul className="divide-y divide-rule border-y border-rule">{pitches.map((pitch) => {
    const posted = pitch.status === "pitched" ? pitch.createdAt : pitch.statusChangedAt;
    return <li key={pitch.pitchId} data-pitch-id={pitch.pitchId} className="py-6">
      <article className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_14rem] md:gap-8">
        <div className="min-w-0 break-words">
          <p className="font-sans text-sm"><Link className="link-quiet font-semibold" href={`/contributors/${pitch.reporterId}`}>{pitch.contributor.name}</Link> · {pitch.contributor.kind === "journalist" ? "Independent Journalist" : "Expert"}{pitch.regionLabel && ` · ${pitch.regionLabel}`}</p>
          <p className="mt-1 font-sans text-xs leading-relaxed text-ink-soft">{pitch.contributor.credentials}</p>
          {pitch.contributor.isSample && <p className="kicker mt-2 text-ink-muted">Fictional sample pitch</p>}
          <h3 className="headline mt-3 text-2xl leading-tight">Pitched: {pitch.topic}</h3>
          {pitch.angle && <p className="mt-2 font-serif text-lg leading-relaxed text-ink-soft">({pitch.angle})</p>}
          {pitch.linkedBlindspot && <p className="mt-4"><Link href={`/story/${pitch.linkedBlindspot.storyId}#blindspots`} className="link-quiet inline-block border border-rule px-2 py-1 font-sans text-xs">linked to an open Blindspot →</Link><span className="mt-1 block font-sans text-xs text-ink-muted">Optional, informational link to a Potential Blindspot in “{pitch.linkedBlindspot.storyTitle}”.</span></p>}
        </div>
        <div className="border-t border-rule pt-3 font-sans text-sm md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <p className="font-semibold">Status: {PITCH_STATUS_LABELS[pitch.status]}</p>
          <p className="mt-1 text-ink-soft"><time dateTime={posted}>{pitch.status === "published" ? date(posted) : `${pitch.status === "in_progress" ? "Started" : "Posted"} ${elapsed(posted)}`}</time></p>
          <p className="mt-3 text-xs text-ink-muted">Self-reported by the journalist</p>
          {pitch.timeframe && <p className="mt-2 text-xs text-ink-soft">Timeframe: {pitch.timeframe}</p>}
          {pitch.status !== "pitched" && <p className="mt-2 text-xs text-ink-muted">Posted <time dateTime={pitch.createdAt}>{date(pitch.createdAt)}</time></p>}
          {pitch.linkedStory && <Link href={`/story/${pitch.linkedStory.id}`} className="link-quiet mt-4 block">View resulting Story →<span className="mt-1 block text-xs">{pitch.linkedStory.title}</span></Link>}
        </div>
      </article>
    </li>;
  })}</ul>;
}
