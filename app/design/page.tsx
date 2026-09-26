import { SOURCE_TYPES, SOURCE_TYPE_COLORS, BLINDSPOT_TYPES } from "@/lib/taxonomy";
import { listStories } from "@/lib/queries";
import { CoverageBar, Kicker, MetaLine, ReadOnPublisher, Rule, SectionHead, SourceTypeBadge, StatusKicker, StoryCard, Icon } from "@/components/ui";

export const metadata = { title: "Design system" };

const COLORS = [
  ["Paper", "#F4F1E8"], ["Ink", "#1E211E"], ["Deep Forest Green", "#123F35"], ["Deep Forest", "#092D27"],
  ["Muted Terracotta", "#B4513D"], ["Ochre", "#C49A45"], ["Warm Gray", "#C9C5B9"],
];

export default function DesignPage() {
  const [story] = listStories({ limit: 1 });
  return (
    <div className="mx-auto max-w-[1100px] space-y-12 px-4 py-10 md:px-6">
      <section>
        <SectionHead title="Color" sub="Restrained and editorial (§10)" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-7">
          {COLORS.map(([n, hex]) => (
            <div key={n}>
              <div className="h-16 border border-rule" style={{ background: hex }} />
              <p className="mt-1 text-xs font-medium">{n}</p>
              <p className="meta">{hex}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <SectionHead title="Typography" sub="Newsreader for headlines, Inter for interface (§11)" />
        <p className="headline text-5xl font-semibold">Metro Manila LGUs prepare for possible flooding</p>
        <p className="mt-3 font-serif text-lg leading-relaxed text-ink-soft">
          Local government units in Metro Manila are on heightened alert as the southwest monsoon continues.
        </p>
        <div className="mt-3 flex gap-4"><Kicker>Daily Briefing</Kicker><Kicker tone="terracotta">Developing</Kicker><StatusKicker status="ongoing" /></div>
      </section>
      <section>
        <SectionHead title="Rules" />
        <Rule double /><div className="h-4" /><Rule />
      </section>
      <section>
        <SectionHead title="Source types" sub="Eight-type taxonomy (§6), neutral palette" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {SOURCE_TYPES.map((t) => (
            <li key={t.id} className="flex gap-3">
              <span className="mt-1 size-3 shrink-0" style={{ background: SOURCE_TYPE_COLORS[t.id] }} />
              <div><SourceTypeBadge type={t.id} /><p className="text-sm text-ink-soft">{t.description}</p></div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <SectionHead title="Blindspot types" sub="Always 'Potential', always with a reason (§7)" />
        <ul className="grid gap-2 sm:grid-cols-2">{BLINDSPOT_TYPES.map((b) => <li key={b.id} className="text-sm"><strong>{b.label}.</strong> {b.description}</li>)}</ul>
      </section>
      {story && (
        <section>
          <SectionHead title="Story card, meta, coverage bar" />
          <div className="grid gap-8 md:grid-cols-2">
            <StoryCard story={story} />
            <div className="space-y-4">
              <MetaLine stats={story.stats} updatedAt={story.updatedAt} updatedLabel="Updated " />
              <CoverageBar byType={story.stats.byType} />
              <ReadOnPublisher url="https://example.org" source={{ name: "The National Daily (sample)", paywalled: true }} />
              <div className="flex gap-3 text-ink-soft">{(["search","globe","bell","user","home","compass","pin","bookmark","columns","alert","doc"] as const).map((i) => <Icon key={i} name={i} />)}</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
