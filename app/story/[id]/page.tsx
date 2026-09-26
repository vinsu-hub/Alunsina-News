// Story detail (§20): headline → context → sources → evidence.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoverageBar, SaveButton, StatusKicker } from "@/components/ui";
import { PhilippineCoverage } from "@/components/coverage/PhilippineCoverage";
import { getRegionCoverage, getStory } from "@/lib/queries";
import { plural, timeAgo } from "@/lib/format";
import { CompareProvider, CompareSlot, CompareToggle } from "@/components/story/CompareMode";
import { CompareView } from "@/components/story/CompareView";
import { ShareButton } from "@/components/story/ShareButton";
import { SourceEmphasis } from "@/components/story/SourceEmphasis";
import { SourceList } from "@/components/story/SourceList";
import { MobileCollapse } from "@/components/story/MobileCollapse";
import {
  Angles,
  Blindspots,
  EvidenceList,
  LanguageBars,
  PublishersByType,
  Section,
  SidebarSummary,
  Timeline,
  WhatHappened,
} from "@/components/story/Sections";
import { dateTime, earliest } from "@/components/story/util";

export async function generateMetadata({ params }: PageProps<"/story/[id]">): Promise<Metadata> {
  const { id } = await params;
  const story = getStory(id);
  if (!story) return { title: "Story not found" };
  return { title: story.title, description: story.summary };
}

export default async function StoryPage({ params }: PageProps<"/story/[id]">) {
  const { id } = await params;
  const story = getStory(id);
  if (!story) notFound();

  const firstReported = earliest(story.articles) ?? story.createdAt;
  const platformCoverage = getRegionCoverage({ sinceHours: 48 });
  const path = `/story/${story.id}`;

  return (
    <CompareProvider key={story.id}>
      <article className="mx-auto max-w-[1280px] px-4 pb-12 pt-6 md:px-6 md:pt-10">
        {/* 1. Story header */}
        <header className="border-b border-ink pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="kicker text-forest">{story.topic}</span>
            <StatusKicker status={story.status} />
          </div>
          <h1 className="headline mt-3 max-w-[22ch] text-[34px] font-semibold leading-[1.08] sm:text-5xl md:max-w-[26ch] md:text-[56px] lg:text-[64px]">
            {story.title}
          </h1>
          <p className="mt-3 max-w-3xl font-serif text-lg leading-relaxed text-ink-soft md:hidden">{story.summary}</p>
          <p className="meta mt-4 flex flex-wrap gap-x-2 gap-y-1">
            <span>{plural(story.stats.sources, "source")}</span>
            <span aria-hidden>·</span>
            <span>{plural(story.stats.regions, "region")}</span>
            <span aria-hidden>·</span>
            <span>{plural(story.stats.languages, "language")}</span>
            <span aria-hidden>·</span>
            <span>
              First reported <time dateTime={firstReported}>{dateTime(firstReported)}</time>
            </span>
            <span aria-hidden>·</span>
            <span>
              Updated <time dateTime={story.updatedAt}>{timeAgo(story.updatedAt)}</time>
            </span>
          </p>
          <CoverageBar byType={story.stats.byType} className="mt-4 max-w-3xl" />
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <CompareToggle />
            <SaveButton storyId={story.id} />
            <ShareButton path={path} title={story.title} />
          </div>
        </header>

        {/* Compare coverage mode (§20) — full width, above the stacked sections */}
        <CompareSlot>
          <CompareView articles={story.articles} emphasis={story.emphasis} />
        </CompareSlot>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-14">
          {/* Main column. DOM order follows §20; `order-*` gives the §24 mobile priority:
              headline, summary, coverage, perspectives, evidence, blindspots, then timeline + sources. */}
          <div className="flex min-w-0 flex-col gap-12">
            <div className="order-1 hidden md:block">
              <WhatHappened story={story} since={firstReported} />
            </div>

            <Section id="timeline" title="Timeline" sub="Manila time" className="order-7 md:order-2">
              <MobileCollapse label="timeline">
                <Timeline events={story.timeline} articles={story.articles} />
              </MobileCollapse>
            </Section>

            <Section id="coverage" title="Coverage" sub="Where, in what language, and by whom this story is reported" className="order-2 md:order-3">
              <PhilippineCoverage coverage={story.coverage} compareTo={platformCoverage} />
              <div className="mt-8">
                <h3 className="kicker mb-2 text-ink-muted">By language</h3>
                <LanguageBars languages={story.languages} />
              </div>
              <div className="mt-8">
                <h3 className="kicker mb-2 text-ink-muted">Publishers by source type</h3>
                <PublishersByType articles={story.articles} />
              </div>
            </Section>

            <div className="order-3 md:order-4">
              <SourceEmphasis id="emphasis" storyTitle={story.title} byType={story.stats.byType} emphasis={story.emphasis} />
            </div>

            <Section id="angles" title="Coverage angles" sub="Which aspects of the story the reporting focuses on" className="order-4 md:order-5">
              <Angles angles={story.angles} />
            </Section>

            <Section id="evidence" title="Evidence / Primary sources" sub="Documents, statements, and data the reporting relies on" className="order-5 md:order-6">
              <EvidenceList evidence={story.evidence} factChecks={story.factChecks} />
            </Section>

            <Section
              id="sources"
              title="Source list"
              sub="Every article in this story, grouped by source type. Read the full reporting on each publisher's site."
              action={plural(story.stats.articles, "article")}
              className="order-8 md:order-7"
            >
              <MobileCollapse label={`all ${story.stats.articles} articles`}>
                <SourceList articles={story.articles} />
              </MobileCollapse>
            </Section>

            <Section id="blindspots" title="Potential blindspots" className="order-6 md:order-8">
              <Blindspots blindspots={story.blindspots} />
            </Section>
          </div>

          <aside className="hidden lg:block" aria-label="Story summary">
            <div className="sticky top-4">
              <SidebarSummary story={story} />
            </div>
          </aside>
        </div>
      </article>
    </CompareProvider>
  );
}
