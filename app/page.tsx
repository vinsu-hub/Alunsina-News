import Link from "next/link";
import { getEdition, getMagnifiedNews } from "@/lib/queries";
import { CoverageChip } from "@/components/ui/CoverageChip";
import { StoryImage } from "@/components/ui/StoryImage";
import { DailyBriefing } from "@/components/home/DailyBriefing";
import { LeadStory } from "@/components/home/LeadStory";
import { BlindspotRail } from "@/components/home/BlindspotRail";
import { EmphasisSection } from "@/components/home/EmphasisSection";
import { MyAreaTeaser } from "@/components/home/MyAreaTeaser";
import { MagnifiedNews } from "@/components/home/MagnifiedNews";
import {
  PhilippineCoverage,
  CompactCoverage,
} from "@/components/coverage/PhilippineCoverage";
import { Emblem } from "@/components/ui/Emblem";
import { timeAgo } from "@/lib/format";
export default async function Home() {
  const [e, luzon, visayas, mindanao] = await Promise.all([
    getEdition(),
    getMagnifiedNews("luzon"),
    getMagnifiedNews("visayas"),
    getMagnifiedNews("mindanao"),
  ]);
  return (
    <div className="homepage mx-auto max-w-[1440px] px-4 pb-10 pt-4 md:px-6">
      <h1 className="sr-only">ALUNSINA NEWS: today&apos;s edition</h1>
      <div className="home-grid">
        <div className="home-briefing border border-rule p-3">
          <DailyBriefing stories={e.briefing} />
        </div>
        <div className="home-lead min-w-0">
          {e.lead ? (
            <>
              <LeadStory story={e.lead} />
              <EmphasisSection story={e.lead} />
            </>
          ) : (
            <p className="headline text-2xl">
              Today&apos;s edition is being assembled.
            </p>
          )}
        </div>
        <aside
          className="home-blindspots border border-rule p-3"
          aria-label="Potential blindspots"
        >
          <BlindspotRail blindspots={e.blindspots} />
        </aside>
        <div className="home-coverage min-w-0">
          <PhilippineCoverage coverage={e.coverage} id="coverage" />
        </div>
        <div className="home-magnified min-w-0">
          <MagnifiedNews entries={{ luzon, visayas, mindanao }} />
        </div>
        <aside
          className="home-local min-w-0 space-y-3"
          aria-label="Regional and local coverage"
        >
          <div className="hidden lg:block">
            <CompactCoverage coverage={e.coverage} />
          </div>
          <MyAreaTeaser />
          <div className="bg-forest p-5 text-paper">
            <p className="font-serif text-xl leading-snug">
              Better information builds a stronger Philippines.
            </p>
            <p className="mt-4 flex items-center gap-2 font-serif text-sm">
              <Emblem /> ALUNSINA NEWS
            </p>
          </div>
        </aside>
        <section
          className="home-top min-w-0 border border-rule p-3"
          aria-labelledby="top-title"
        >
          <header className="mb-3 flex justify-between border-b border-rule pb-2">
            <h2 id="top-title" className="font-serif text-xl uppercase">
              Top News Stories
            </h2>
            <Link href="/explore" className="text-xs text-forest">
              View all →
            </Link>
          </header>
          <ul className="no-scrollbar flex gap-4 overflow-x-auto md:grid md:grid-cols-5">
            {e.topStories.slice(0, 5).map((s) => (
              <li key={s.id} className="min-w-0 w-[230px] shrink-0 md:w-auto">
                <StoryImage
                  image={s.leadImage}
                  alt={s.title}
                  topic={s.topic}
                  ratio="4/3"
                />
                <p className="kicker mt-2 text-[9px] text-forest">{s.topic}</p>
                <h3 className="headline mt-1 text-[18px] leading-snug">
                  <Link href={`/story/${s.id}`}>{s.title}</Link>
                </h3>
                <CoverageChip
                  storyId={s.id}
                  stats={s.stats}
                  className="mt-2 flex-wrap text-[10px]"
                />
                <p className="meta mt-1 text-[10px]">{timeAgo(s.updatedAt)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
