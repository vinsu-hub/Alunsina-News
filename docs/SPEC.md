# ALUNSINA NEWS — Product Spec (v2, condensed)

Section numbers match the original product doc. Requirements only; rationale trimmed.

**Core idea:** One story. Multiple sources. Fuller context. A Philippine news-comparison platform (Ground News-like usefulness) that groups articles into **Stories** and shows what happened, who covers it, where from, what each source type emphasizes, evidence, region/language coverage, and potential gaps. It should feel like a **modern Philippine newspaper with an intelligence layer**, not a SaaS dashboard.

## §2 Brand
Always display **ALUNSINA NEWS** in full — never an acronym. Lines: "Truth has more than one source." / "More context. A clearer picture." Never politically partisan.

## §4 Not Left/Center/Right
Describe coverage by observable traits (source type, language, geography, evidence, angle). No bias scores.

## §5A Sourcing & licensing
Store only headline, byline/publisher, timestamp, 1–2 sentence excerpt, canonical link, language, region, source type. Reader finishes on the publisher's site. Every article card has **"Read on [Publisher]"**. Paywalled sources show **"Subscription required"**. Source profiles show data status: Data Partner / Public feed / Headline + link only. Ingestion tiers: RSS → official statements → partner outlets → licensed nationals.

## §6 Vocabulary
- **Story**: grouped event covered by multiple sources.
- **Source types (8)**: Primary Document, Government Statement, State-Run Media, National Media, Regional Media, Independent, Community, Social / Viral. Use all eight everywhere (Explore, Story, Source Profiles).
- **Perspectives/Emphasis**: what each source group emphasizes (descriptive, never "who is right").
- **Coverage**: regions, publishers, languages, source types, timing.
- **Evidence**: primary documents, statements, datasets, studies, reports.
- **Potential Blindspots**: always "Potential"; always explain *why* it was detected.

## §7 Blindspot types
Geographic · Language · Source · Evidence · Timing · Local · Topic/Angle · Social/Misinformation. Social: never assert true/false — only that verification is thin; if a fact-checker (VERA Files, Rappler Fact Check, Tsek.ph) published on it, link that instead of showing the blindspot.

## §8 Methodology & Trust page
Public, linked from footer + Sources nav. Plain language: how articles become a Story; how source types are assigned and reviewed; exact blindspot thresholds (from `lib/thresholds.ts`); how ownership data is sourced/kept current; corrections process (flag a miscategorized source or wrongly clustered story; how it's resolved); statement that ALUNSINA links out rather than republishing.

## §9–11 Visual
Digital newspaper + editorial intelligence. Ground News-level density, front-page structure, serif headlines, thin rules, multi-column, compact metadata, restrained cards. Avoid: SaaS look, heavy rounded cards, neon, gradients, futuristic UI, political color coding, bias meters. Colors: Paper #F4F1E8, Ink #1E211E, Forest #123F35, Deep Forest #092D27, Terracotta #B4513D, Ochre #C49A45, Warm Gray #C9C5B9. Fonts: Newsreader (headlines), Inter (UI).

## §12 Header (built)
Masthead: left "PHILIPPINES / DAILY EDITION / date", center ALUNSINA NEWS, tagline "ANALYZE · SOURCES · INSIGHTS · NAVIGATE", right Search/Language/Notifications/Profile. Nav: Home, Explore, My Area, Topics, Regions, Sources, Blindspots. Trending ticker.

## §13 Homepage
Opens with news, no marketing hero. Order:
Masthead → Nav → Trending → **3 columns: Daily Briefing | Featured/Lead Story | Potential Blindspots** → Featured story cards → What Sources Are Emphasizing → Philippine Coverage → My Area → Top News Stories → Footer.
- Each blindspot card shows a one-line **example from a real current story** + link (e.g. "Most coverage of the flooding story comes from Metro Manila. Few reports found from Rizal or Bulacan… → See coverage by region"). Types with no current example are hidden.
- **Right rail (Blindspots / Coverage / My Area) is ad-free.** Any ad slot sits between Featured Story Cards and Top News Stories, clearly labeled.

## §14 Daily Briefing
Compact numbered list of 5. Each item: category, headline, source count, regions, languages, time ("18 sources · 7 regions · 3 languages"). Header summarizes only the briefing: "5 stories · ~5 min read". The platform-wide article count never sits beside it (it lives in the footer).

## §15 Featured Story
Dominant element. Kicker (DEVELOPING), large serif headline, summary, meta (sources, regions, languages, "Updated 2h ago"), primary action "Explore coverage →".

## §16 What Sources Are Emphasizing
Always tied to a named story. Header:
`WHAT SOURCES ARE EMPHASIZING` / `On: "<story title>"`. Homepage uses the Featured Story; Story page uses its own. A **stacked coverage bar** by source type above the category lists (e.g. 5 Government · 6 National · 4 Regional · 3 Independent). Then bullet lists per source type. Social/Viral only when applicable.

## §17 Philippine Coverage
Map/breakdown of where a story is reported. Default zoom: Luzon/Visayas/Mindanao %. Click island → its regions (NCR, CAR, Region I…). Click region → stories and sources from that region; compare against national average; local reporting. Same system as the Explore region list.

## §18 My Area
Local newspaper insert, e.g. "MY AREA — San Pablo · Laguna" with counts (12 Local stories · 27 Regional stories · 8 Government updates), local stories, regional stories, government updates, community reports, local sources.
Location flow: (1) empty state "Set your area to see local coverage" with city/municipality search + optional "Use my current location"; (2) city/municipality granularity only; (3) "Change location →" always in the header; (4) reserve "+ Add another area" (later phase).

## §19 Explore
Header "EXPLORE — Discover stories beyond the headlines." Sub-nav: Topics · Regions · Sources · Languages · Saved. Topic index; Regions (National, Luzon, Visayas, Mindanao, then the 17 regions); Sources by all 8 types; Languages (English, Filipino, Cebuano, Ilocano, Hiligaynon, Kapampangan, Waray, Bikol, Other); Trending Topics ranked by volume ("01 Flood Control…"). **Blindspots section lives inside Explore** too (mobile access, §24).

## §20 Story Detail
Story Header → What Happened → Timeline → Coverage → What Sources Emphasize → Coverage Angles → Evidence / Primary Sources → Source List → Potential Blindspots. Headline → context → sources → evidence.
**Compare coverage mode** (toggle in header): 2+ panes side by side, each one source's article (headline, excerpt, "Read on [Publisher] →"); a source-type picker above each pane to swap sources; on mobile a swipeable single-column sequence.

## §21 Timeline
Time-stamped development: "08:30 Government statement released · 10:15 National outlets begin reporting · …".

## §22 Source Profiles
Name, source type (8), **Ownership / affiliation** (factual, no editorializing), **Data status**, geographic coverage, languages, topics, stories covered, primary-source links, recent articles, coverage footprint.

## §23 Search
Returns **Stories**, not articles: STORY / headline / 18 sources · 7 regions · 4 languages / Latest update 2h ago.

## §24 Mobile
Bottom nav: Home · Explore · My Area · Saved · Profile (built). Blindspots: per story + section inside Explore. Story page priority: headline, summary, source count, coverage, perspectives, evidence, blindspots. Not a dense dashboard.

## §26 Editorial principles
Distinguish reporting vs analysis and primary vs secondary; show provenance; surface gaps carefully; multilingual; make regional journalism discoverable; no bias scores; don't tell readers what to conclude; show evidence; indicate uncertainty; timestamp developing info; disclose ownership factually; flag social claims as unverified; always link out.

## §27 Personality
Editorial, intelligent, Philippine, accessible, trust-oriented.
