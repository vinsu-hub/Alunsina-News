import { CoverageChip } from "@/components/ui/CoverageChip";
import { StoryImage } from "@/components/ui/StoryImage";
import { Emblem } from "@/components/ui/Emblem";
import Link from "next/link";
import {
  SOURCE_TYPES,
  SOURCE_TYPE_COLORS,
  BLINDSPOT_TYPES,
} from "@/lib/taxonomy";
import { listStories, getEdition } from "@/lib/queries";
import {
  CoverageBar,
  CoverageBreakdown,
  Kicker,
  MetaLine,
  ReadOnPublisher,
  Rule,
  SectionHead,
  SourceTypeBadge,
  StatusKicker,
  StoryCard,
  Icon,
  SaveButton,
  SubscriptionTag,
  type IconName,
} from "@/components/ui";

export const metadata = { title: "Design system" };

const COLORS = [
  ["Paper", "#F5F3EA"],
  ["Paper deep", "#EBE6D8"],
  ["Ink", "#17201F"],
  ["Ink soft", "#4A4D47"],
  ["Ink muted", "#68706D"],
  ["Forest", "#123B36"],
  ["Forest dark", "#092D27"],
  ["Terracotta", "#B95532"],
  ["Ochre", "#B49A62"],
  ["Rule", "#C9C5B9"],
];
const ICONS: IconName[] = [
  "search",
  "globe",
  "bell",
  "user",
  "home",
  "compass",
  "pin",
  "bookmark",
  "arrow",
  "external",
  "close",
  "menu",
  "columns",
  "locate",
  "alert",
  "doc",
];

export default async function DesignPage() {
  const [story] = await listStories({ limit: 1 });
  const edition = await getEdition();
  return (
    <div className="mx-auto max-w-[1100px] space-y-10 px-4 py-8 md:px-6 md:py-10">
      <header className="border-b border-rule pb-6">
        <Kicker tone="forest">ALUNSINA NEWS · Living style guide</Kicker>
        <h1 className="headline mt-2 text-4xl font-semibold md:text-5xl">
          The language of the edition
        </h1>
        <p className="mt-3 max-w-2xl font-serif text-lg text-ink-soft">
          Newsreader headlines, Inter interfaces, and restrained newspaper
          rules. These are the shared primitives used across every edition.
        </p>
        <nav
          aria-label="Style guide sections"
          className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-forest"
        >
          {[
            ["color", "Color"],
            ["type", "Typography"],
            ["labels", "Labels"],
            ["rules", "Rules & headings"],
            ["coverage", "Coverage"],
            ["stories", "Story cards"],
            ["actions", "Actions"],
            ["icons", "Icons"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="link-quiet">
              {label}
            </a>
          ))}
        </nav>
      </header>
      <section id="brand">
        <SectionHead title="Emblem, CoverageChip & StoryImage" />
        <Emblem className="my-4 text-forest" />
        {story && (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <CoverageChip storyId={story.id} stats={story.stats} />
              <div className="mt-3">
                <CoverageChip
                  storyId={story.id}
                  stats={story.stats}
                  variant="full"
                />
              </div>
            </div>
            <StoryImage
              image={story.leadImage}
              alt={story.title}
              topic={story.topic}
              ratio="4/3"
            />
          </div>
        )}
      </section>
      <section id="color">
        <SectionHead
          title="Color"
          sub="Ten shared tokens; source colors describe source types, never political positions."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {COLORS.map(([name, hex]) => (
            <div key={name}>
              <div
                className="h-16 border border-rule"
                style={{ background: hex }}
              />
              <p className="mt-1 text-xs font-medium">{name}</p>
              <p className="meta">{hex}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="type">
        <SectionHead
          title="Typography"
          sub="Newsreader for reporting; Inter for navigation and compact metadata."
        />
        <p className="headline text-3xl font-semibold leading-tight md:text-5xl">
          Metro Manila LGUs prepare for possible flooding
        </p>
        <p className="mt-3 max-w-2xl font-serif text-lg leading-relaxed text-ink-soft">
          Local government units are on heightened alert as the southwest
          monsoon continues. A readable summary introduces the reporting without
          replacing it.
        </p>
        {story && (
          <MetaLine
            stats={story.stats}
            updatedAt={story.updatedAt}
            updatedLabel="Updated "
            className="mt-3"
          />
        )}
        <p className="meta mt-2">Metadata · tabular numerals · 12px Inter</p>
        <Link
          href="/methodology"
          className="link-quiet mt-3 inline-block text-sm text-forest"
        >
          Quiet link to methodology →
        </Link>
      </section>
      <section id="labels">
        <SectionHead
          title="Kicker & StatusKicker"
          sub="Settled stories intentionally render no status label."
        />
        <div className="flex flex-wrap gap-5">
          {(["ink", "forest", "terracotta", "muted"] as const).map((tone) => (
            <Kicker key={tone} tone={tone}>
              {tone} kicker
            </Kicker>
          ))}
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          {(["developing", "ongoing", "settled"] as const).map((status) => (
            <div key={status} className="border-t border-rule pt-2">
              <dt className="meta mb-2">{status}</dt>
              <dd>
                <StatusKicker status={status} />
                {status === "settled" && (
                  <span className="text-xs text-ink-soft">No status shown</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <h3 className="kicker mt-6 mb-3">
          SourceTypeBadge · full and short labels
        </h3>
        <ul className="grid gap-4 sm:grid-cols-2">
          {SOURCE_TYPES.map((t) => (
            <li key={t.id}>
              <div className="flex flex-wrap gap-3">
                <SourceTypeBadge type={t.id} />
                <SourceTypeBadge type={t.id} short />
              </div>
              <p className="mt-1 text-sm text-ink-soft">{t.description}</p>
              <span className="meta">Swatch {SOURCE_TYPE_COLORS[t.id]}</span>
            </li>
          ))}
        </ul>
        <h3 className="kicker mt-6 mb-3">Potential Blindspots · vocabulary</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {BLINDSPOT_TYPES.map((b) => (
            <li key={b.id} className="text-sm">
              <strong>{b.label}.</strong> {b.description}
            </li>
          ))}
        </ul>
        <p className="meta mt-3">
          Every detected example includes its reason. Social claims are never
          rated true or false.
        </p>
      </section>
      <section id="rules">
        <SectionHead
          title="Rule & SectionHead"
          sub="Thin dividers separate reports; double rules introduce sections."
          action={
            <Link href="/" className="link-quiet">
              View edition →
            </Link>
          }
        />
        <p className="meta mb-2">Rule · default</p>
        <Rule />
        <p className="meta mt-5 mb-2">Rule · double</p>
        <Rule double />
        <div className="mt-6">
          <SectionHead
            as="h3"
            title="A subsection heading"
            sub="Optional subtitle and action; h2 or h3 semantics."
            action={
              <a href="#type" className="link-quiet">
                Typography →
              </a>
            }
          />
        </div>
      </section>
      <section id="coverage">
        <SectionHead
          title="CoverageBar & CoverageBreakdown"
          sub="Source composition and geographic reporting, with keyboard-operable island drill-down."
        />
        {story && (
          <div className="space-y-4">
            <CoverageBar byType={story.stats.byType} height={12} />
            <div>
              <p className="meta mb-2">Compact bar · no legend</p>
              <CoverageBar
                byType={story.stats.byType}
                showLegend={false}
                height={4}
              />
            </div>
          </div>
        )}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="kicker mb-3">Interactive island coverage</h3>
            <CoverageBreakdown coverage={edition.coverage} />
          </div>
          <div>
            <h3 className="kicker mb-3">Empty coverage</h3>
            <CoverageBreakdown coverage={[]} />
            <p className="meta mt-3">
              A CoverageBar with no sources renders nothing.
            </p>
            <CoverageBar byType={{}} />
          </div>
        </div>
      </section>
      {story && (
        <section id="stories">
          <SectionHead
            title="StoryCard"
            sub="Standard teasers and compact list entries share headline, topic, status, and metadata."
          />
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="meta mb-3">Standard</p>
              <StoryCard story={story} />
            </div>
            <div>
              <p className="meta mb-3">Compact</p>
              <StoryCard story={story} variant="compact" />
              <p className="meta mt-6 mb-3">Compact · topic hidden</p>
              <StoryCard story={story} variant="compact" showTopic={false} />
            </div>
          </div>
        </section>
      )}
      <section id="actions">
        <SectionHead
          title="SaveButton, ReadOnPublisher & SubscriptionTag"
          sub="Save is a local preference. Reading always continues on the original publisher’s site."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="kicker mb-2">
              Save · toggle to see the saved state
            </h3>
            <SaveButton
              storyId={story?.id ?? "design-example"}
              className="border border-rule px-3 py-2"
            />
          </div>
          <div className="space-y-3">
            <ReadOnPublisher
              url="https://example.org"
              source={{ name: "The National Daily (sample)", paywalled: false }}
            />
            <ReadOnPublisher
              url="https://example.org"
              source={{ name: "The National Daily (sample)", paywalled: true }}
            />
            <div>
              <p className="meta mb-2">Standalone subscription tag</p>
              <SubscriptionTag />
            </div>
          </div>
        </div>
      </section>
      <section id="icons">
        <SectionHead
          title="Icon"
          sub="All sixteen stroke icons, shown with visible labels. Decorative icons are hidden from assistive technology."
        />
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-8">
          {ICONS.map((name) => (
            <li key={name} className="border-t border-rule py-3">
              <Icon name={name} size={24} label={name} />
              <p className="meta mt-2">{name}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
