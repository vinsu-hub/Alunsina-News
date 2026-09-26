import Link from "next/link";
import { getEdition } from "@/lib/queries";
import { StoryCard } from "@/components/ui";
import { DailyBriefing } from "@/components/home/DailyBriefing";
import { LeadStory } from "@/components/home/LeadStory";
import { BlindspotRail } from "@/components/home/BlindspotRail";
import { EmphasisSection } from "@/components/home/EmphasisSection";
import { AdSlot } from "@/components/home/AdSlot";
import { MyAreaTeaser } from "@/components/home/MyAreaTeaser";
import { PhilippineCoverage } from "@/components/coverage/PhilippineCoverage";

// Front page (§13). Opens straight into news; no hero.
export default async function Home() {
  const e = await getEdition();
  const lead = e.lead;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-6 pb-12 md:px-6 md:pt-8">
      <h1 className="sr-only">ALUNSINA NEWS: today&apos;s edition</h1>

      {/* Top band: Briefing | Lead | Blindspots. Mobile order: Lead → Briefing → Blindspots. */}
      <div className="grid gap-y-10 lg:grid-cols-12 lg:gap-x-0">
        <div className="order-2 lg:order-1 lg:col-span-3 lg:border-r lg:border-rule lg:pr-6">
          <DailyBriefing stories={e.briefing} />
        </div>
        <div className="order-1 lg:order-2 lg:col-span-6 lg:px-7">
          {lead ? (
            <LeadStory story={lead} />
          ) : (
            <p className="headline border-t-[3px] border-ink pt-3 text-2xl">Today&apos;s edition is being assembled.</p>
          )}
        </div>
        <aside className="order-3 lg:col-span-3 lg:border-l lg:border-rule lg:pl-6" aria-label="Potential blindspots">
          <BlindspotRail blindspots={e.blindspots} />
        </aside>
      </div>

      {/* Featured story cards */}
      {e.featured.length > 0 && (
        <section aria-labelledby="featured-title" className="mt-12">
          <header className="section-head mb-5">
            <h2 id="featured-title" className="kicker mt-2 text-ink">
              Featured Stories
            </h2>
          </header>
          <div className="grid gap-y-8 md:grid-cols-3 md:divide-x md:divide-rule">
            {e.featured.map((s) => (
              <StoryCard key={s.id} story={s} className="md:px-6 md:first:pl-0 md:last:pr-0" />
            ))}
          </div>
        </section>
      )}

      {/* Ad slot: main column only, between Featured and the lower sections — never in the right rail. */}
      <AdSlot className="mt-12" />

      {lead && (
        <div className="mt-12">
          <EmphasisSection story={lead} />
        </div>
      )}

      {/* Coverage + My Area side by side (ad-free rail). */}
      <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-x-8">
        <div className="min-w-0 lg:col-span-8">
          <PhilippineCoverage
            id="coverage"
            coverage={lead ? lead.coverage : e.coverage}
            compareTo={lead ? e.coverage : undefined}
            sub={
              lead ? (
                <>
                  Where{" "}
                  <Link href={`/story/${lead.id}`} className="link-quiet not-italic text-ink">
                    &ldquo;{lead.title}&rdquo;
                  </Link>{" "}
                  is being reported
                </>
              ) : (
                "Where today's stories are being reported"
              )
            }
          />
        </div>
        <aside className="lg:col-span-4" aria-label="My Area">
          <MyAreaTeaser />
        </aside>
      </div>

      {/* Top News Stories */}
      {e.topStories.length > 0 && (
        <section aria-labelledby="top-title" className="mt-12">
          <header className="section-head mb-2">
            <div className="mt-2 flex items-baseline justify-between gap-4">
              <h2 id="top-title" className="kicker text-ink">
                Top News Stories
              </h2>
              <Link href="/explore" className="meta link-quiet">
                Explore all stories →
              </Link>
            </div>
          </header>
          <ul className="grid md:grid-cols-2 md:gap-x-8 lg:grid-cols-3">
            {e.topStories.map((s) => (
              <li key={s.id} className="border-b border-rule py-4">
                <StoryCard story={s} variant="compact" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
