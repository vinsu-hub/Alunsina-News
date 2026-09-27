import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SourceTypeBadge } from "@/components/ui";
import { CONTAINER } from "@/components/explore/PageHeader";
import { BLINDSPOT_RULES, CLUSTERING, RELATED_STORIES } from "@/lib/thresholds";
import { BLINDSPOT_TYPES, DATA_STATUSES, SOURCE_TYPES } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "Methodology & Trust",
  description:
    "How ALUNSINA NEWS groups articles into stories, assigns source types, flags potential blindspots, sources ownership data, and handles corrections.",
};

// Placeholder inbox until the editorial team confirms the address.
const CORRECTIONS_EMAIL = "corrections@alunsina.news";

const TOC = [
  ["how-stories", "How articles become a Story"],
  ["source-types", "Source types"],
  ["blindspots", "Potential blindspots"],
  ["ownership", "Ownership & affiliation"],
  ["corrections", "Corrections"],
  ["linking", "We link out"],
  ["related-stories", "Related Stories"],
  ["contributors", "Contributors"],
  ["pitch-board", "Pitch Board"],
  ["magnified", "Magnified News"],
  ["principles", "Editorial principles"],
] as const;

const PRINCIPLES = [
  "Distinguish reporting from analysis, and primary sources from secondary ones.",
  "Show provenance: where every piece of information came from.",
  "Surface coverage gaps carefully, and always explain why.",
  "Treat the Philippines as multilingual; English and Filipino are not the whole story.",
  "Make regional journalism discoverable.",
  "No bias scores. We describe sources by what they are, not what they believe.",
  "Don't tell readers what to conclude.",
  "Show the evidence.",
  "Indicate uncertainty.",
  "Timestamp developing information.",
  "Disclose ownership factually.",
  "Flag social-media claims as unverified until someone has reported on them.",
  "Always link out to the original publisher.",
];

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-16 border-t-[3px] border-ink pt-3">
      <p className="kicker text-ochre">§ {String(n).padStart(2, "0")}</p>
      <h2 id={`${id}-h`} className="headline mt-1 text-3xl font-semibold leading-tight md:text-4xl">
        {title}
      </h2>
      <div className="prose-methodology mt-4 space-y-4 font-serif text-[17px] leading-relaxed text-ink-soft [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <div className={`${CONTAINER} pt-8 md:pt-12`}>
      <header className="border-b border-ink pb-6">
        <p className="kicker text-forest">Methodology &amp; Trust</p>
        <h1 className="headline mt-2 max-w-4xl text-4xl font-semibold leading-[1.05] md:text-6xl">
          How we compare the news, and how to hold us to it.
        </h1>
        <p className="mt-4 max-w-3xl font-serif text-lg italic leading-snug text-ink-soft md:text-xl">
          ALUNSINA NEWS groups reporting from many publishers into Stories so you can see who is covering what, from
          where, and in which language. This page explains every rule we use, in plain language, and how to tell us
          when we get something wrong.
        </p>
      </header>

      <div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="sticky top-0 z-20 min-w-0 self-start bg-paper py-2 lg:top-6">
          <p className="kicker border-b border-ink pb-1 text-ink">Contents</p>
          <ol className="no-scrollbar mt-1 flex gap-4 overflow-x-auto font-sans text-[13px] lg:block">
            {TOC.map(([id, label], i) => (
              <li key={id} className="shrink-0 border-b border-rule/60 lg:shrink">
                <a href={`#${id}`} className="flex gap-2 py-1.5 text-ink-soft hover:text-ink">
                  <span className="tabular-nums text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 max-w-[72ch] space-y-14">
          <Section id="how-stories" n={1} title="How articles become a Story">
            <p>
              A <strong>Story</strong> is one event or development, covered by more than one source. We collect
              headlines and short excerpts from each publisher&rsquo;s public feed, then compare the words in each
              headline and excerpt. Articles that talk about the same thing, using enough of the same key words, are
              grouped together.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Time window.</strong> Articles published more than {CLUSTERING.windowHours} hours apart are
                never grouped into the same Story.
              </li>
              <li>
                <strong>Similarity.</strong> Two articles can be grouped when their text-similarity score reaches{" "}
                {CLUSTERING.similarity} on a scale from 0 to 1. We weight distinctive words in headlines and excerpts
                using TF-IDF, then compare them with cosine similarity after removing common words. This score is
                not a percentage of matching words or a measure of accuracy.
              </li>
              <li>
                <strong>More than one source.</strong> A group needs at least {CLUSTERING.minSourcesForStory} different
                publishers to become a Story. A single outlet&rsquo;s article stays an article.
              </li>
              <li>
                <strong>Front page.</strong> Only Stories with at least {CLUSTERING.frontPageMinSources} sources can
                appear in the daily edition.
              </li>
            </ul>
            <p>
              The grouping is automatic, and it can be wrong: two separate events can be merged, or one event split in
              two. If you spot one, please <a href="#corrections" className="link-quiet text-ink">tell us</a>.
            </p>
          </Section>

          <Section id="source-types" n={2} title="Source types">
            <p>
              Every source is assigned one of nine types. Types describe <strong>what a source is</strong>, such as
              an official record, a national newsroom, or a campus paper. They never describe what it believes. We do
              not use left, center, or right labels, and we do not score bias.
            </p>
            <dl className="divide-y divide-rule border-y border-rule font-sans text-[15px]">
              {SOURCE_TYPES.map((t) => (
                <div key={t.id} className="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
                  <dt>
                    <SourceTypeBadge type={t.id} />
                  </dt>
                  <dd className="text-ink-soft">
                    {t.description}{" "}
                    <Link href={`/sources?type=${t.id}`} className="link-quiet whitespace-nowrap text-ink">
                      See sources
                    </Link>
                  </dd>
                </div>
              ))}
            </dl>
            <p>
              <strong>How types are assigned.</strong> A type is set when a source is added, based on who publishes
              it, where its newsroom and audience are, and whether it has a formal government affiliation. An outlet
              owned or run by government is State-Run Media even when its reporting is independent in practice; a
              private outlet reporting on a government statement is not.
            </p>
            <p>
              <strong>Human review.</strong> Every assignment is reviewed by the ALUNSINA NEWS editorial team before a
              source goes live, and reviewed again whenever ownership changes or a reader questions it. Automated
              tools never change a source&rsquo;s type on their own.
            </p>
          </Section>

          <Section id="blindspots" n={3} title="Potential blindspots">
            <p>
              A <strong>potential blindspot</strong> is a signal that coverage of a Story may be thin in some way. We
              always call them &ldquo;potential&rdquo;: reporting may exist that we don&rsquo;t yet read, and a gap is
              a prompt to look closer, not a claim that anyone is hiding something. Every flag shows the specific
              reason it was raised.
            </p>
            <p>These are the exact rules the system uses today. This list is generated from the same settings the detector runs on, so it always matches.</p>
            <ol className="space-y-4">
              {Object.entries(BLINDSPOT_RULES).map(([id, rule], i) => (
                <li key={id} className="border-l-2 border-terracotta pl-4">
                  <p className="kicker text-terracotta">
                    {String(i + 1).padStart(2, "0")} · {BLINDSPOT_TYPES.find((b) => b.id === id)?.label ?? id}
                  </p>
                  <p className="mt-1 font-sans text-[15px] text-ink-soft">{BLINDSPOT_TYPES.find((b) => b.id === id)?.description}</p>
                  <p className="mt-1 font-sans text-[15px] text-ink">
                    <span className="font-semibold">Rule: </span>
                    {rule.text}
                  </p>
                </li>
              ))}
            </ol>
            <p>
              <strong>Social claims.</strong> We never say a social-media claim is true or false. We only say that
              independent verification is thin. When a fact-checker such as VERA Files, Rappler Fact Check, or Tsek.ph
              publishes on the claim, we link to their work and remove the flag.
            </p>
            <p>
              <Link href="/blindspots" className="link-quiet text-ink">See current potential blindspots →</Link>
            </p>
          </Section>

          <Section id="ownership" n={4} title="Ownership & affiliation">
            <p>
              Each Source Profile states who owns or runs the publication. We take this from the publisher&rsquo;s own
              disclosures (About and corporate pages) and from public filings, such as Securities and Exchange
              Commission and Philippine Stock Exchange disclosures, and government charters for state-run outlets. Each
              profile names the document the information came from.
            </p>
            <p>
              <strong>Facts only.</strong> We record who owns what. We do not characterize owners, speculate about
              influence, or rate independence.
            </p>
            <p>
              <strong>Keeping it current.</strong> The editorial team re-checks every ownership entry at least once
              every six months, and immediately when a sale, merger, or change in affiliation is reported. Readers can
              flag an outdated entry through the corrections process below.
            </p>
          </Section>

          <Section id="corrections" n={5} title="Corrections">
            <p>Use the “This doesn’t belong here” flag on Coverage or Related Stories to report a mismatched article or story link. These are separate judgments, and either can be wrong.</p>
            <p>Tell us if you think we have:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>assigned a source the wrong type, region, or language;</li>
              <li>stated ownership or affiliation incorrectly or out of date;</li>
              <li>grouped unrelated articles into one Story, or split one event into several;</li>
              <li>flagged a potential blindspot that doesn&rsquo;t hold up, or missed reporting that exists.</li>
            </ul>
            <div className="border border-ink bg-paper-deep p-4 font-sans text-[15px] text-ink">
              <p className="kicker text-ink">Send a correction</p>
              <p className="mt-2">
                Email{" "}
                <a
                  href={`mailto:${CORRECTIONS_EMAIL}?subject=${encodeURIComponent("Correction request")}`}
                  className="font-semibold text-forest underline underline-offset-4"
                >
                  {CORRECTIONS_EMAIL}
                </a>{" "}
                with the page link, what you think is wrong, and any supporting document.
              </p>
              <p className="mt-2 text-[13px] text-ink-soft">Sample edition: this contact address and the review targets below must be confirmed before the service launches.</p>
            </div>
            <p>
              <strong>What happens next.</strong> Our target is to acknowledge requests within 2 working days. An editor
              reviews the request against the source&rsquo;s own disclosures and public records, aiming to resolve it
              within 7 working days; complex cases receive a progress update with the reason for delay. If we change a source type, ownership entry, or Story grouping, the change is made on the
              site and we reply to explain the decision. If we don&rsquo;t change it, we explain why.
            </p>
          </Section>

          <Section id="linking" n={6} title="We link out; we don't republish">
            <p>
              ALUNSINA NEWS is an index, not a copy. For each article we keep only the headline, publisher and byline,
              publication time, a short excerpt of one or two sentences, the language, the region, and a link. Every
              article carries a <strong>&ldquo;Read on [Publisher]&rdquo;</strong> link, and you finish reading on the
              publisher&rsquo;s own site. Paywalled publications are marked &ldquo;Subscription required.&rdquo;
            </p>
            <p>Each Source Profile shows how we receive that publisher&rsquo;s material:</p>
            <dl className="divide-y divide-rule border-y border-rule font-sans text-[15px]">
              {DATA_STATUSES.map((d) => (
                <div key={d.id} className="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="font-semibold text-ink">{d.label}</dt>
                  <dd className="text-ink-soft">{d.description}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="related-stories" n={7} title="Related Stories">
            <p>{RELATED_STORIES.text}</p><p>Coverage groups articles about the same event into one Story. Related Stories connect different events in a continuing issue. Both automated judgments can be wrong; use the “This doesn’t belong here” flag to request a correction.</p>
          </Section>
          <Section id="contributors" n={8} title="Contributors: verification and disclosure">
            <p>Independent Journalists provide original reporting with a portfolio and byline history. Experts provide commentary in their field. Verification checks real identity, credentials, expertise or portfolio, and affiliation, never political alignment. Contributors are verified for identity and expertise, not viewpoint.</p>
            <p>Declared conflicts of interest are shown prominently on contributor profiles, including party membership, paid consulting, board seats, and government appointments. Commentary is always labeled <strong>Analysis — Not Reporting</strong> and never counts as a reporting source.</p>
            <p>Contributor commentary is original content hosted by ALUNSINA NEWS. Its editorial and liability responsibilities differ from linking to a publisher’s reporting; review and correction policies must cover that hosted content.</p>
            <p>All current contributor profiles and commentary are fictional samples. Applications are not processed yet. Handling under RA 10173 (Data Privacy Act), consent, retention, access, and deletion arrangements are to be finalized before collection begins. <Link href="/contribute" className="link-quiet">Application preview →</Link></p>
          </Section>
          <Section id="pitch-board" n={9} title="Pitch Board: reporting without topic approval">
            <p>Verification is a one-time identity and expertise gate, never per-story approval. Verified journalists can pitch any topic. The site owner records pitches and status changes on the journalist’s behalf; there are no contributor logins or per-story sign-offs.</p>
            <p>Both pitches and published pieces pass an automated safety pre-screen. It checks only jailbreak and injection patterns, and harassment, threats, doxxing, and targeted-defamation patterns. It never checks topic, viewpoint, or whether an official is named.</p>
            <p>Items are held until the screen runs and passes. If screening is unavailable, the item stays pending; flagged items remain held. There is no manual pass or override.</p>
            <p>Links to Potential Blindspots are optional, system-suggested, and informational. They do not assign a story, reserve a topic, or limit what a journalist may investigate.</p>
            <p>Status is self-reported by the journalist: Pitched, In Progress, or Published. It is not inferred by the system. Published pieces enter the normal Independent Journalist source and story-grouping pipeline and receive no ranking boost, including in Magnified News.</p>
            <p><Link href="/experts/reporting" className="link-quiet">Visit Reporting in Progress →</Link></p>
          </Section>
          <Section id="magnified" n={10} title="Magnified News: earned regional discovery">
            <p><strong>Placement is never purchased.</strong> Sponsored material, if introduced, must be labeled and structurally separate. Every entry has an attributed publisher or journalist byline.</p>
            <p>Qualifying stories include independent, regional, community, or Independent Journalist reporting in the island within 72 hours. Ranking uses three times the number of distinct eligible sources, plus distinct regions, plus freshness (0–1 over 72 hours). Two of five Luzon slots are reserved for stories touching non-NCR regions when qualifying stories exist. Regional reader engagement is not collected yet; global traffic and payments are not ranking inputs.</p>
          </Section>
          <Section id="principles" n={11} title="Editorial principles">
            <ol className="grid gap-x-8 gap-y-2 font-sans text-[15px] sm:grid-cols-2">
              {PRINCIPLES.map((p, i) => (
                <li key={p} className="flex gap-3 border-t border-rule pt-2">
                  <span className="font-serif text-lg font-semibold leading-none text-ochre tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-ink-soft">{p}</span>
                </li>
              ))}
            </ol>
          </Section>
        </article>
      </div>
    </div>
  );
}
