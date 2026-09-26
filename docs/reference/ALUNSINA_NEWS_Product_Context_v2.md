# ALUNSINA NEWS --- Product Context & UI Direction

> **v2 changelog** --- this revision closes the following gaps found in
> a review of the original doc + first homepage build:
> content sourcing/licensing was undefined (§5A, new); "Government /
> Primary" conflated three different trust levels (§6, revised);
> ownership/affiliation transparency was missing from source profiles
> (§23, revised); there was no misinformation/social-media layer, which
> matters a lot in the PH context (§6, §7, revised); there was no public
> methodology/trust page (§9, new); the homepage's Blindspots and
> Philippine Coverage sections weren't tied to specific stories or
> granular regions (§14, §18, revised); Story Detail had no actual
> side-by-side comparison reading mode (§21, revised); mobile nav
> silently dropped Blindspots (§25, revised); and "My Area" assumed a
> location was already set with no onboarding flow described (§19,
> revised).
>
> **v2.1 changelog** --- added a contributor layer for **Independent
> Journalists** (a ninth source type, §6) and **Expert Contributors**
> --- verified academics/analysts who submit signed critique, kept
> structurally separate from reporting so it never inflates a story's
> source count (§8, new). This also surfaces a liability-model question
> the aggregation-only approach in §5A doesn't have to deal with: hosted
> commentary is original content ALUNSINA is directly responsible for.

# 1. Product Overview

**ALUNSINA NEWS** is a Philippine-focused news intelligence and
news-comparison platform inspired by the usefulness of Ground News, but
designed specifically around the Philippine media ecosystem.

The core idea is:

> **One story. Multiple sources. Fuller context.**

Instead of treating news as isolated articles, ALUNSINA NEWS groups
reporting about the same event into a **Story** and helps readers
understand:

-   what happened
-   which sources are covering it
-   where the reporting is coming from
-   what different source types emphasize
-   what evidence supports the reporting
-   how coverage differs by region and language
-   where there may be gaps in coverage

The product should feel like a **modern digital Philippine newspaper
with an intelligence/comparison layer**, rather than a conventional SaaS
dashboard.

------------------------------------------------------------------------

# 2. Brand

## Name

**ALUNSINA NEWS**

No abbreviation should be used in the visible brand.

Do not shorten the brand to an acronym in the interface.

The visual identity should consistently display:

> **ALUNSINA NEWS**

Possible editorial line:

> **Truth has more than one source.**

Another supporting positioning line:

> **More context. A clearer picture.**

The product should communicate substance, context, investigation, and
source comparison without becoming politically partisan.

------------------------------------------------------------------------

# 3. Product Philosophy

ALUNSINA NEWS is built around the idea that a single headline rarely
represents the complete picture.

A story may be reported differently by:

-   national media
-   regional media
-   government agencies
-   independent publishers
-   community sources
-   Filipino-language publications
-   regional-language publications
-   primary documents

ALUNSINA brings those reports together.

### Core flow

``` text
ARTICLE
   ↓
STORY CLUSTER
   ↓
MULTIPLE SOURCES
   ↓
SOURCE COMPARISON
   ↓
PERSPECTIVES / COVERAGE
   ↓
EVIDENCE
   ↓
CONTEXT
   ↓
FULLER STORY
```

------------------------------------------------------------------------

# 4. Why It Is Different From Ground News

The interface can borrow the **editorial clarity and comparison
concept** users may recognize from Ground News, but ALUNSINA should not
simply reproduce a Left / Center / Right framework.

The Philippine media environment needs more descriptive dimensions.

Instead of assigning political bias scores, ALUNSINA should organize
coverage using observable characteristics such as:

-   National
-   Regional
-   Government / Primary
-   Independent
-   Community
-   Language
-   Geography
-   Evidence availability
-   Coverage angle

These are intended to describe **where reporting comes from and what it
covers**, not tell users which political position is correct.

------------------------------------------------------------------------

# 5A. Content Sourcing & Licensing Strategy

This has to be decided before any content pipeline is built. Full-text
scraping and republishing of PH publishers (Inquirer, GMA, PhilStar,
Rappler, regional papers, etc.) without agreement is a legal risk and
most paywalled outlets actively block it.

## Aggregation model

ALUNSINA should follow the **Ground News model**: pull structured
metadata, not full articles.

For every article ingested, store only:

-   headline
-   byline / publisher
-   publish timestamp
-   a short excerpt (one or two sentences, fair-use length)
-   canonical link back to the original publisher
-   detected language, region, source type

The reader always finishes on the **publisher's own site** to read the
full piece. ALUNSINA is the discovery/comparison layer, not a mirror.

## Ingestion tiers

1.  **RSS / public feeds** --- most PH outlets still expose RSS; lowest
    friction, start here.
2.  **Official public statements** --- PCOO, agency press pages,
    Official Gazette, LGU Facebook/press pages (for primary documents).
3.  **Partnership outlets** --- direct data-sharing agreements with
    regional/community publishers who benefit from the distribution
    ALUNSINA can send them. This is where the platform can actually
    help fix the Metro-Manila-centric blindspot, since many regional
    papers have no discovery layer today.
4.  **Licensed national outlets** --- pursued only once the product has
    traction to negotiate from; until then, headline + excerpt + link
    under fair use.

## What this changes downstream

-   Every Story/article card needs a visible **"Read on [Publisher]"**
    action, not a full in-app reader, unless a publisher has explicitly
    licensed full-text display.
-   Source Profiles (§23) should show whether a publisher is a **data
    partner** or **aggregated via public feed**, since that affects how
    much of their content can be shown.
-   Paywalled sources should carry a small **"Subscription required"**
    tag so users aren't surprised when the outbound link hits a
    paywall.

------------------------------------------------------------------------

# 6. Core Product Vocabulary

Use these terms throughout the product.

## Story

A grouped event or subject that is covered by multiple sources.

Example:

> Metro Manila LGUs prepare for possible flooding as rains persist

A Story contains multiple articles and sources.

## Sources

The publishers, organizations, agencies, documents, or other sources
contributing to a story.

**Revised source-type taxonomy.** The original doc grouped "Government"
and "Primary" into a single bucket. These are different trust levels
and should be separate types, plus a social/viral type to reflect how
PH news actually breaks:

-   **Primary Document** --- a law, court filing, budget line item,
    dataset, or official record. Not authored editorially; closest
    thing to raw evidence.
-   **Government Statement** --- a press release or official
    statement from an agency or LGU. Editorial in tone but
    attributable to a specific office.
-   **State-Run Media** --- outlets with formal government affiliation
    (PTV, PNA, PCOO-linked channels). Distinct from an independent
    outlet covering a government statement.
-   **National Media** --- unchanged from original doc.
-   **Regional Media** --- unchanged from original doc.
-   **Independent** --- unchanged from original doc.
-   **Independent Journalist** --- an individual, byline-driven
    reporter rather than an outlet (freelance, self-published, or
    community-radio). Same trust tier as Independent, verified
    separately --- see §8.
-   **Community** --- unchanged from original doc.
-   **Social / Viral** --- a claim or clip circulating on Facebook,
    Twitter/X, or TikTok with no editorial reporting behind it yet.
    Tracked so ALUNSINA can flag "this is spreading online but hasn't
    been independently reported" rather than staying silent on stories
    users are already seeing elsewhere.

Every "Sources" list in the product (Explore §20, Story Detail §21,
Source Profiles §23) should use this nine-type list, not the original
five. Note that **Expert Contributors are not part of this list at
all** --- they submit analysis, not reporting, and are handled as a
separate contributor layer (§8) so they never inflate a story's source
count.

## Perspectives

A descriptive comparison of what different source groups emphasize.

Example:

-   Government --- implementation, funding, policy
-   National Media --- national impact, political implications
-   Regional Media --- local effects, community response
-   Independent --- evidence, accountability, long-term impact

## Coverage

Shows where and how extensively a story is being reported.

Can include:

-   regions
-   publishers
-   languages
-   source types
-   publication timing

## Coverage Chip (new)

A small, reusable UI element --- e.g. "12 sources · view coverage"
--- attached to **every** place a single article or headline appears
in the product, not just the Story Detail Page. This is the concrete
answer to "can I see how other outlets covered this" no matter where a
reader encounters a headline: a Daily Briefing row, a Top News card, a
search result, a side-by-side comparison pane (§21), even a single
excerpt inside Explore. Tapping it always goes to that article's Story
cluster (§21).

Without a standardized chip, this cross-link either has to be
reinvented per surface or --- more likely --- gets forgotten on smaller
surfaces (exactly what happened with "What Sources Are Emphasizing" not
being clearly attached to a story, §17). Treat the chip as one
component built once and reused everywhere an article-level element
exists.

## Related Stories / Continuing Coverage (new)

Distinct from Coverage. Coverage links articles about the **same
event**, reported by different outlets, into one Story. Related
Stories link **different Stories** that are part of the same ongoing
situation over time --- e.g. "LGUs prepare for flooding" →
(two days later) "Flood damage assessment begins" →
(a week later) "Relief operations expand to Rizal." Each of those is
its own Story with its own separate Coverage/sources, but a reader
following a developing situation shouldn't have to search for the next
chapter manually.

Shown on the Story Detail Page as a **Related Stories** rail (§21),
and this is also what backs the "DEVELOPING" tag already used on the
Featured Story (§16) --- a developing story is one that's expected to
generate Related Stories as it unfolds.

## Evidence

Shows primary documents, official statements, datasets, studies,
reports, and other supporting material.

## Potential Blindspots

Potential areas where available coverage appears limited.

Important:

Use **"Potential Blindspot"** rather than claiming that a blindspot
definitely exists.

Every blindspot should explain why it was detected.

Examples:

-   Geographic
-   Language
-   Source
-   Evidence
-   Timing
-   Local
-   Topic / Angle
-   Social / Misinformation --- a claim is circulating widely on social
    media but has little or no independent reporting confirming or
    debunking it yet.

------------------------------------------------------------------------

# 7. Philippine-Specific Blindspot System

## Geographic

A story may receive heavy coverage from Metro Manila while affected
provinces receive little reporting.

Example:

> Most coverage comes from Metro Manila. Few reports found from affected
> provinces.

## Language

A story may be extensively covered in English or Filipino while
regional-language reporting is limited.

Example:

> Limited Filipino and regional-language coverage detected.

## Source

Many articles may originate from a small number of publishers or repeat
the same official statement.

Example:

> Coverage relies heavily on government statements and a small number of
> publishers.

## Evidence

A story may contain many reports but limited links to primary
documentation.

Example:

> Some claims lack primary-source documentation or verifiable data.

## Timing

A story may be developing faster than the available reporting.

## Local

A national story may have little reporting from communities directly
affected.

## Topic / Angle

Most sources may focus on one aspect while another relevant aspect
receives little attention.

## Social / Misinformation

A claim, screenshot, or clip may be circulating heavily on social media
while independent outlets have not yet reported, confirmed, or debunked
it. This is common in the Philippines around elections, disasters, and
health scares.

Example:

> This claim is spreading widely on social media. No independent
> reporting has confirmed or debunked it yet.

This blindspot should never assert the claim is true or false --- only
that verification is currently thin. If a fact-check organization
(e.g. VERA Files, Rappler Fact Check, Tsek.ph) has published on it,
link to that directly instead of showing this blindspot.

The interface should always show the reason behind a potential blindspot
rather than presenting it as an absolute fact.

------------------------------------------------------------------------

# 8. Independent Journalists & Expert Contributors

A new contributor layer, distinct from the news-aggregation model in
§5A: verified individual journalists and subject-matter experts
(political science / public administration / economics professors,
former officials, policy analysts) who can submit their own signed
analysis or critique of a Story directly to ALUNSINA.

This is the digital equivalent of a newspaper's **Op-Ed page** ---
consistent with the "digital Philippine newspaper" identity in §1 ---
kept clearly separate from the news-comparison machinery so it never
gets mistaken for reporting.

## Two contributor types

-   **Independent Journalist** --- an individual, byline-driven
    reporter, often freelance or self-published (Substack, personal
    site, community radio), submitting original reporting rather than
    analysis. Sits alongside the existing **Independent** (outlet) type
    in the source taxonomy (§6) as a ninth type --- same trust
    category, individual rather than organizational.
-   **Expert Contributor** --- an academic, former official, or
    policy specialist submitting **critique/analysis**, not reporting.
    This is new content, not a new source type, and must never be
    counted in a Story's source/coverage metrics (the "18 sources · 7
    regions" line stays reporting-only).

## Verification, not viewpoint-screening

Applications are reviewed for **identity and expertise**, never for
political alignment. A reviewer checks:

-   real identity (no anonymous or pseudonymous contributors)
-   for Independent Journalists: a portfolio, byline history, or press
    credential
-   for Expert Contributors: institutional affiliation, published
    academic or professional work in the relevant field
-   **declared conflicts of interest** --- party membership, paid
    consulting, board seats, government appointments --- shown
    publicly on the contributor's profile, not just collected
    internally

Approval is about "is this a real, qualified person," not "do we agree
with them." Rejecting or removing a contributor for the *content* of
their views (as opposed to a verification or conduct problem) would
break the platform's neutrality positioning (§27) and should require
an explicit, documented reason unrelated to viewpoint.

## Where it appears

-   A new **EXPERT COMMENTARY** section on the Story Detail Page (§21),
    visually distinct from Coverage/Sources --- different card
    treatment, a persistent "Analysis --- Not Reporting" label, and its
    own byline block showing the contributor's name, credentials, and
    any declared conflicts inline (not buried on a separate profile).
-   When more than one Expert Contributor has weighed in on a story,
    show more than one if available, the same way §17 already shows
    multiple source categories --- a single expert's take should never
    be the only framing offered.
-   A contributor gets a profile page structured like Source Profiles
    (§23): name, credentials, affiliation, declared conflicts, and
    their contribution history.

## Liability model differs from §5A --- flag this explicitly

§5A's aggregation model (headline + excerpt + link-out) keeps ALUNSINA
mostly out of the liability chain for the reporting itself. Hosted
Expert Commentary is different: it's **original content published on
ALUNSINA's own platform**, so ALUNSINA carries direct editorial and
legal responsibility for it (defamation exposure, right-of-reply
obligations if a critique names a specific official or agency). This
needs its own moderation and legal review process before launch --- it
should not be treated as a UI feature you can ship with the same
assumptions as the aggregation pipeline. A fast automated pre-screen
for jailbreak/injection attempts and toxicity/threats (§25A) can sit in
front of a human reviewer to cut volume, but it doesn't replace the
legal review itself --- flagged again in §31, since it isn't resolved
yet.

------------------------------------------------------------------------

# 9. Methodology & Trust Page

A public, permanently-linked page (footer + Sources nav) explaining how
the product actually works. Without this, "Potential Blindspot" and
"neutral by design" are just claims with nothing backing them.

Should plainly explain, in non-technical language:

-   how articles get grouped into a Story (clustering logic, in plain
    terms --- not source code), and separately, how distinct Stories
    get connected as Related Stories/continuing coverage (§21) ---
    these are two different judgment calls and both can be wrong
-   how a source gets assigned a type (Government Statement vs.
    State-Run Media vs. Independent, etc.) and who reviews that
    assignment
-   how a Potential Blindspot gets triggered --- what threshold of
    "few reports" or "limited language coverage" means
-   how ownership/affiliation data (§23) is sourced and kept current
-   a corrections process: how a user flags a miscategorized source or
    a wrongly-clustered story, and how that gets resolved
-   a plain statement that ALUNSINA links out to original reporting
    rather than republishing it (ties to §5A)

This page is what makes "Truth has more than one source" a credible
claim rather than a slogan.

------------------------------------------------------------------------

# 10. Brand Visual Direction

## Overall Style

The visual language should combine:

**Digital Philippine newspaper + editorial intelligence platform**

Reference qualities:

-   Ground News-style information density
-   newspaper front-page structure
-   editorial typography
-   thin divider rules
-   multi-column layouts
-   strong headlines
-   compact metadata
-   restrained cards
-   structured information
-   generous but controlled whitespace

Avoid:

-   generic SaaS dashboard appearance
-   excessive rounded cards
-   neon colors
-   excessive gradients
-   overly futuristic UI
-   political color coding
-   simplistic bias meters

------------------------------------------------------------------------

# 11. Color System

Primary background:

``` text
Paper / Cream
#F4F1E8
```

Primary text:

``` text
Ink
#1E211E
```

Primary brand:

``` text
Deep Forest Green
#123F35
```

Dark brand:

``` text
Deep Forest
#092D27
```

Accent:

``` text
Muted Terracotta
#B4513D
```

Secondary accent:

``` text
Ochre
#C49A45
```

Rules / borders:

``` text
Warm Gray
#C9C5B9
```

Colors should remain restrained and editorial.

------------------------------------------------------------------------

# 12. Typography

## Headlines

Use an editorial serif such as:

-   Newsreader
-   Source Serif
-   Cormorant
-   Instrument Serif

Headlines should feel like a newspaper.

## Interface

Use a clean sans-serif such as:

-   Inter
-   Geist
-   Manrope

Metadata should be compact and readable.

------------------------------------------------------------------------

# 13. Global Header

The header should resemble a premium newspaper masthead.

### Top area

Left:

``` text
PHILIPPINES
DAILY EDITION
FRI, SEP 26, 2025
```

Center:

``` text
ALUNSINA NEWS
```

Below masthead:

``` text
ANALYZE · SOURCES · INSIGHTS · NAVIGATE
```

Right:

-   Search
-   Language
-   Notifications
-   Profile

### Main navigation

``` text
Home
Explore
My Area
Topics
Regions
Sources
Blindspots
```

### Trending ticker

``` text
TRENDING TOPICS →
Government · Economy · Education · Health · Environment · Transport · Business · Agriculture · Technology
```

------------------------------------------------------------------------

# 14. Homepage Direction

The homepage should feel like the front page of a newspaper.

It should not open with a huge marketing hero.

Instead, users should immediately see news.

Recommended structure:

``` text
MASTHEAD
↓
MAIN NAVIGATION
↓
TRENDING TOPICS
↓
┌──────────────┬──────────────────────────┬────────────────┐
│ DAILY        │ FEATURED / LEAD STORY   │ POTENTIAL      │
│ BRIEFING     │                          │ BLINDSPOTS     │
└──────────────┴──────────────────────────┴────────────────┘
↓
FEATURED STORY CARDS
↓
WHAT SOURCES ARE EMPHASIZING
↓
PHILIPPINE COVERAGE
↓
MY AREA
↓
TOP NEWS STORIES
↓
FOOTER
```

**Fix: each Potential Blindspots card must link to a real, current
example.** The original build showed four permanent-sounding cards
("Most coverage comes from Metro Manila...") with no story attached, so
they read as static wallpaper text rather than live findings. Each card
needs a one-line example drawn from today's actual stories, e.g.:

``` text
Geographic
Most coverage of the flooding story comes from Metro Manila. Few
reports found from Rizal or Bulacan, which are also affected.
→ See coverage by region
```

If a card genuinely has no current example (a quiet news day for that
blindspot type), it should say so or be hidden rather than showing a
generic statement with nothing behind it.

**Fix: keep the right rail (Blindspots / Coverage / My Area) ad-free.**
The original build placed an ad directly beneath "My Area," inside the
same rail as the platform's core trust features. That undercuts the
trust-oriented brand positioning (§28). Ads, if needed for revenue
early on, should sit in a clearly separate placement (e.g. between
Featured Story Cards and Top News Stories) rather than inside the
trust/analysis column.

------------------------------------------------------------------------

# 15. Daily Briefing

A newspaper-style compact list.

Example:

### DAILY BRIEFING

1.  DOJ to file charges vs. former officials in flood control anomaly
2.  Rice prices remain high despite new import order
3.  Experts warn of worsening coral bleaching in Palawan
4.  DOH urges continued vigilance vs. dengue cases
5.  MMDA implements new traffic scheme in EDSA

Each item should display:

-   category
-   headline
-   source count
-   regions
-   languages
-   time

Example:

``` text
18 sources · 7 regions · 3 languages
```

This line **is** the Coverage Chip (§6) --- it should be tappable on
every item, not just decorative text, so "18 sources" always jumps
straight into that Story's coverage.

**Header stat block fix.** The briefing's own header should only
summarize the briefing itself --- e.g. "5 stories · ~5 min read" --- and
drop any platform-wide article count from that line. A separate,
clearly-labeled stat like "460 articles analyzed today across the
platform" can live elsewhere (e.g. a footer stat or an "About today's
edition" tooltip), but should never sit next to the 5-story briefing
count where it reads as if it describes the same 5 stories.

------------------------------------------------------------------------

# 16. Featured Story

The central story should be the dominant visual element.

Example:

### DEVELOPING

**Metro Manila LGUs prepare for possible flooding as rains persist**

Supporting summary:

> Local government units in Metro Manila are on heightened alert as the
> southwest monsoon continues to bring heavy rains, raising concerns
> about possible flooding in low-lying areas.

Metadata:

``` text
18 sources
7 regions
4 languages
Updated 2h ago
```

Primary action:

> Explore coverage →

Secondary story cards can sit below the lead story.

------------------------------------------------------------------------

# 17. What Sources Are Emphasizing

This is one of the product's most important sections.

Instead of saying which source is "right," show what different source
categories emphasize.

**Fix: always attach this section to one named story.** In the original
homepage build this rendered as a floating, generic block with no
heading, which reads like a permanent site feature rather than analysis
of the flooding story above it. The section header must always read:

``` text
WHAT SOURCES ARE EMPHASIZING
On: "Metro Manila LGUs prepare for possible flooding as rains persist"
```

so a user never has to guess which story the breakdown belongs to. On
the homepage this is the Featured Story's breakdown; on a Story Detail
page (§21) it's that story's own breakdown.

**Add a numeric coverage bar above the category list** --- a single
horizontal stacked bar showing what share of total sources fall into
each category (e.g. 5 Government · 6 National · 4 Regional ·
3 Independent), similar to Ground News's left/center/right bar but
built from your source-type taxonomy instead of a political axis. This
gives users an at-a-glance read before they scan the bullet lists
below.

Example:

### Government Statement

-   Policy announcement
-   Implementation
-   Funding

### National Media

-   Political implications
-   National impact
-   Public response

### Regional Media

-   Local implementation
-   Community impact
-   Regional effects

### Independent

-   Evidence
-   Accountability
-   Long-term impact

### Social / Viral (only shown when applicable)

-   What's circulating that hasn't been independently reported yet

The purpose is to help users understand differences in coverage.

------------------------------------------------------------------------

# 18. Philippine Coverage

A visual Philippines map can show where a story is being reported.

**Fix: match granularity to the Explore page's region list (§20).**
Island-group percentages (Luzon/Visayas/Mindanao) are a fine default
zoom level, but the original build stopped there while Explore promises
region-level browsing (NCR, CAR, Region I, etc.). The two need to be the
same system at different zoom levels, not two separate ones:

``` text
Default view (homepage):
Luzon       61%
Visayas     24%
Mindanao    15%

Click "Luzon" → expands to:
NCR             38%
CAR              4%
Region I         6%
Region III      11%
CALABARZON      12%
...
```

The map should support interaction:

-   click island group → drill into its regions
-   click a region → see stories from that region
-   see sources reporting from that region
-   compare coverage against the national average
-   see local reporting specifically

This becomes especially important for the Philippine context because
national coverage can be heavily concentrated in Metro Manila.

------------------------------------------------------------------------

# 18A. Magnified News

A curated **Top 5** leaderboard per island group --- Luzon, Visayas,
Mindanao --- refreshed daily, surfacing the most significant regional
stories of the moment. Two goals, both real:

1.  Fix the Metro-Manila-centric blindspot (§7) by giving a reader in
    Luzon a fast, direct way to see what's actually happening in
    Visayas or Mindanao, not just national headlines that happen to
    mention those regions in passing.
2.  Give regional, community, and Independent Journalist sources
    (§6) **earned discovery placement** they don't get on
    Manila-dominated national platforms.

## Where it lives

-   A homepage module with three tabs (Luzon / Visayas / Mindanao),
    placed near Philippine Coverage (§18) since they share the same
    regional data.
-   Also reachable from Explore → Regions (§20), as the "editor's
    picks" layer on top of the raw region browse list.

## Selection must be earned, not bought

This is the part that makes or breaks the feature's credibility:

-   **Placement can never be purchased.** No outlet, however large,
    can pay for a Top 5 slot. If sponsored regional content is ever
    introduced elsewhere on the platform, it must be labeled
    "Sponsored" and kept structurally separate from this leaderboard.
-   **Selection signals** (published in the Methodology page, §9, the
    same way blindspot thresholds are): number of independent sources
    reporting a story, recency, how many distinct localities within
    the region it touches, and reader engagement measured *within
    that region's My Area users* rather than platform-wide traffic ---
    otherwise a Manila-adjacent story would dominate every list by
    sheer audience size.
-   **Reserve slots within Luzon specifically**, since "Luzon" as a
    label includes NCR. Without a safeguard, NCR stories would crowd
    out CALABARZON, Bicol, Ilocos, etc. every single day. At least 2
    of the 5 Luzon slots should be reserved for non-NCR regions when
    qualifying stories exist.
-   **Every entry carries a real, attributed byline** --- the
    reporting outlet or Independent Journalist (§6), never anonymous.
    This is the actual mechanism that delivers goal #2 above: a
    reader who discovers a story through Magnified News can follow
    that outlet or journalist afterward (Source Profiles, §23), which
    is where the real, lasting benefit to regional journalism comes
    from.

## Example

``` text
MAGNIFIED NEWS --- VISAYAS
Top 5 today

1. Cebu port congestion delays inter-island cargo
   Sun.Star Cebu · 6 sources · 3 provinces

2. Bohol farmers report early dry spell effects on rice yield
   Bohol Chronicle · Independent Journalist byline · 2 sources
...
```

The "N sources" figure on each entry is the same Coverage Chip (§6)
used everywhere else in the product --- consistent with Daily Briefing,
Search, and Explore, not a Magnified-News-specific display.

------------------------------------------------------------------------

# 19. My Area

A localized news section.

Example:

``` text
MY AREA
San Pablo · Laguna
```

Show:

-   local stories
-   regional stories
-   government updates
-   community reports
-   local events
-   local source coverage

Example:

``` text
12 Local stories
27 Regional stories
8 Government updates
```

This should feel like a **local newspaper insert**, not a generic
location dashboard.

## Setting a location (missing from original spec)

Nothing in the original doc described how "San Pablo · Laguna" gets set
in the first place. Needed flow:

1.  **First visit, no location set** --- My Area shows an empty state:
    "Set your area to see local coverage," with a search field
    (city/municipality, not GPS-only, since not everyone will grant
    location permission) and an optional "Use my current location"
    button.
2.  **Granularity** --- city/municipality level, not full street
    address; this is a news feed, not a delivery app, and PH users may
    be wary of giving precise location for something this visible.
3.  **Change location** --- always reachable from the My Area header
    (shown in the build as "Change location →"), so users who move or
    want to check another area's coverage aren't stuck.
4.  **Multiple areas (later phase)** --- a user working in one city and
    from another province may want to track both; not required for v1
    but worth reserving the UI space for a "+ Add another area" action.

------------------------------------------------------------------------

# 20. Explore Page

The Explore page should behave like a newspaper index combined with a
discovery system.

Main navigation:

``` text
EXPLORE

Topics
Regions
Sources
Languages
Experts & Commentary
Saved
```

Recommended Explore structure:

### Explore Header

``` text
EXPLORE
Discover stories beyond the headlines.
```

### Topic Index

``` text
Government
Economy
Education
Health
Environment
Transport
Business
Agriculture
Technology
Climate
```

### Regions

``` text
National
Luzon
Visayas
Mindanao
NCR
CAR
Region I
Region II
...
```

### Sources

Browse by (updated to the nine-type taxonomy in §6):

``` text
National Media
Regional Media
Primary Document
Government Statement
State-Run Media
Independent
Independent Journalist
Community
Social / Viral
```

### Experts & Commentary (new)

A separate index from Sources, since Expert Contributors submit
analysis rather than reporting (§8). Browse by field/expertise rather
than source type:

``` text
Political Science
Public Administration / Governance
Economics
Law
Environment / Climate Policy
Public Health
```

Each entry links to a contributor's profile (credentials, affiliation,
declared conflicts --- structured like Source Profiles, §23) and their
recent commentary. This is also where Blindspots lives on mobile, per
§25.

### Languages

``` text
English
Filipino
Cebuano
Ilocano
Hiligaynon
Kapampangan
Waray
Bikol
Other Philippine Languages
```

### Trending Topics

Show ranked-by-volume topics without turning them into political
recommendations.

Example:

``` text
01 Flood Control
02 Rice Prices
03 Education
04 West Philippine Sea
05 Inflation
```

------------------------------------------------------------------------

# 21. Story Detail Page

A Story page should be the central intelligence experience.

Structure:

``` text
STORY HEADER
↓
WHAT HAPPENED
↓
STORY TIMELINE
↓
COVERAGE
↓
WHAT SOURCES EMPHASIZE
↓
COVERAGE ANGLES
↓
EVIDENCE / PRIMARY SOURCES
↓
EXPERT COMMENTARY  (§8 --- visually separated, "Analysis --- Not Reporting")
↓
RELATED STORIES  (continuing coverage of the same situation, see below)
↓
SOURCE LIST
↓
POTENTIAL BLINDSPOTS
```

Expert Commentary sits after Evidence and before the Source List
deliberately --- late enough that a reader has already seen the
reporting and evidence, so analysis reads as commentary on established
facts rather than as part of the facts themselves.

The user should be able to move from headline → context → sources →
evidence.

## Side-by-side comparison mode (missing from original spec)

"Coverage" and "What Sources Emphasize" describe the data but the
original spec never defines an actual reading experience for comparing
articles --- everything is stacked summary sections. Add a dedicated
mode, reachable via a "Compare coverage" toggle in the Story Header:

-   Two (or more, on desktop) panes open side by side, each showing one
    source's article --- headline, excerpt, and a "Read on
    [Publisher] →" link (full text stays on the publisher's site, per
    §5A).
-   A source-type picker above each pane lets the user swap in a
    different source ("swap right pane to Regional Media") without
    leaving the view.
-   On mobile, this becomes a swipeable single-column sequence instead
    of side-by-side panes, in line with §25's mobile priorities.

This is the single most-used feature on Ground News and is currently
absent from the story page despite being implied by "Coverage
Comparison" and "Source Comparison" in the vocabulary and roadmap
(§26).

## Related Stories (missing from original spec)

Every article-level element in the product should carry a Coverage
Chip (§6) linking back to this Story's own coverage --- that answers
"who else reported this exact event." Related Stories answers a
different question: "what happened next, or before, in this situation."

``` text
RELATED STORIES
Metro Manila LGUs prepare for possible flooding as rains persist

← 2 days ago: Southwest monsoon rains intensify across Luzon
→ Developing: Flood damage assessment begins in low-lying barangays
```

Rules:

-   Related Stories are shown as a **timeline-ordered rail**, not a
    generic "you might also like" list --- earlier entries first,
    clearly marked as past or upcoming relative to the current Story.
-   A Story only gets linked as "related" with reasonable clustering
    confidence (see below); low-confidence matches are left off rather
    than guessed at, consistent with how Potential Blindspots (§7)
    prefer under-claiming over over-claiming.
-   This is what "DEVELOPING" (§16) actually cashes out to for the
    reader --- a developing story is one where Related Stories is
    expected to keep growing.

## Matching confidence & corrections

Both same-event clustering (Coverage) and cross-event linking (Related
Stories) are algorithmic judgment calls, and PH-specific ambiguity is
real --- two LGUs can each declare a flood emergency on the same day
for unrelated reasons, and a naive matcher could wrongly cluster them.
Two things need to exist before this ships, not after:

-   A visible **confidence signal** internally used to decide whether
    two articles get clustered/linked at all --- low-confidence matches
    should simply not appear rather than appearing wrong.
-   A user-facing **"this doesn't belong here"** flag on both Coverage
    and Related Stories, feeding into the same corrections process
    described in the Methodology & Trust page (§9).

------------------------------------------------------------------------

# 22. Story Timeline

Timeline shows how the story developed.

Example:

``` text
08:30
Government statement released

10:15
National outlets begin reporting

11:40
Regional reports emerge

13:20
Primary document published

15:00
Additional local reporting appears
```

This makes the product useful for developing stories.

------------------------------------------------------------------------

# 23. Source Profiles

A Source page should describe a publisher without reducing it to a
single political score.

Display:

-   Publisher name
-   Source type (using the nine-type taxonomy in §6, not the original
    five)
-   **Ownership / affiliation** --- known parent company, media
    conglomerate, or government affiliation, stated factually with no
    editorializing (new field --- see rationale below)
-   **Data status** --- "Data Partner," "Public feed," or "Headline +
    link only," so users understand how much of this source's content
    ALUNSINA can actually show (ties to §5A)
-   Geographic coverage
-   Languages
-   Topics
-   Stories covered
-   Primary-source links
-   Recent articles
-   Coverage footprint

**Why ownership matters here:** ALUNSINA deliberately avoids political
bias scores, but ownership is a factual data point, not a political
judgment --- readers benefit from knowing a publisher belongs to a
particular business group or media network the same way they benefit
from knowing its region or language. This is arguably more useful in
the Philippine market than a left/right label would be, given how
concentrated PH media ownership is.

Example:

``` text
SOURCE
Publisher Name

Type:
Regional Media

Ownership:
Independently owned

Data status:
Public feed (headline + excerpt, link to full article)

Primary regions:
CALABARZON
Central Luzon

Languages:
Filipino
English

Topics:
Local Government
Environment
Education
```

------------------------------------------------------------------------

# 24. Search

Search should primarily return **Stories**, not isolated articles.

Search examples:

``` text
rice prices
flood control
Los Baños
West Philippine Sea
education reform
```

Result structure:

``` text
STORY
Headline

18 sources
7 regions
4 languages

Latest update: 2h ago
```

Users can then open the Story and inspect individual articles.

The "18 sources / 7 regions / 4 languages" block here is the same
Coverage Chip (§6) used everywhere else --- one component, reused
across Daily Briefing, Search, Explore, and comparison panes, rather
than a search-specific version.

------------------------------------------------------------------------

# 25. Mobile Product

Mobile should preserve the editorial hierarchy.

Recommended bottom navigation:

``` text
Home
Explore
My Area
Saved
Profile
```

**Fix: Blindspots was a primary desktop nav item (§13) but had no home
in the mobile nav at all.** Rather than adding a sixth bottom-nav slot
(crowds the bar), surface it in two other ways: (1) it stays visible
per-story since story pages already prioritize "blindspots" as item 7
below, and (2) add it as a section inside **Explore**, so it's never
more than one tap away even though it doesn't get its own bottom-nav
icon.

Story pages should prioritize:

1.  headline
2.  summary
3.  source count
4.  coverage
5.  perspectives
6.  evidence
7.  blindspots

Avoid turning mobile into a dense analytics dashboard.

------------------------------------------------------------------------

# 25A. Runtime Architecture & Automation Pipeline

Everything above is product/UI direction. This section captures how it
actually runs, for a solo developer, so this reasoning isn't lost
outside the chat that produced it.

## The pipeline

``` text
1. INGEST      (hourly)      → RSS/public feeds only, per §5A --- no HTML
                                 scraping, no paid X/social reads yet
2. CLUSTER     (each cycle)  → group same-event articles into a Story
3. SYNTHESIZE  (Claude API)  → summaries, source tagging, blindspots,
                                 Magnified News ranking (§18A)
4. STORE                     → database, not source files
5. SERVE                     → site reads from the database; no rebuild
                                 or redeploy needed when data changes
```

## Two-tier hosting, start cheap

-   **MVP:** GitHub Actions on a cron schedule (free), writing committed
    JSON that a static site builds from. Zero infrastructure cost,
    fully version-controlled.
-   **Scaled:** swap committed JSON for a small Postgres instance
    (Supabase free tier) behind a dynamically-rendered site (Vercel
    free tier) --- data changes don't require a rebuild at all.

Either way: **content is data, not code.** The recurring job updates
database rows or JSON files; it should never be rewriting the site's
own source files on a schedule --- that's what Claude Code is for
during development, not what should run unattended every 12 hours.

## The two-model harness

-   **Claude (Sonnet/Haiku via the API)** does the reasoning and
    writing: ambiguous clustering calls, the "What Happened" summary,
    "What Sources Emphasize," blindspot explanations, Magnified News
    blurbs. This is the only layer that should generate reader-facing
    text.
-   **Laya/Jev-style typed-decision model (optional, add later)** ---
    a fast, narrow classifier for repetitive structured decisions:
    source-type tagging, duplicate pre-filtering before an expensive
    clustering call, and --- concretely useful for §8 --- a
    jailbreak/moderation pre-screen on every Independent Journalist or
    Expert Contributor submission before it reaches a human reviewer.
    Its zero-shot accuracy is weak without fine-tuning on your own
    labeled examples, so **start Claude-only** (Haiku for the cheap
    classification tasks) and introduce this layer later once you have
    real logged decisions to fine-tune it on.

## Cost levers

Confirm current numbers on Anthropic's pricing page before budgeting,
but at time of writing: Haiku is the cheap classification/tagging
tier, Sonnet the synthesis tier, the **Batch API** gives a flat
discount and fits a 12-hour cycle naturally since batch jobs return
within 24 hours anyway, and **prompt caching** is worth using since the
taxonomy/instructions (§6, §7) are identical on every call within a
cycle.

------------------------------------------------------------------------

# 26. Main UI Generation Roadmap

Generate the UI in the following order.

## Phase 00 --- Foundations (new --- do before any UI)

0a. Content sourcing & licensing decisions (§5A)
0b. Finalized source-type taxonomy (§6) and blindspot types (§7)
0c. Independent Journalist & Expert Contributor verification workflow,
    including legal/moderation review for hosted commentary (§8)
0d. Methodology & Trust page copy (§9)

## Phase 01 --- Brand

1.  ALUNSINA NEWS Masthead
2.  Global Header
3.  Navigation
4.  Design System
4a. Coverage Chip component (§6) --- build once, reuse across Daily
    Briefing, Search, Explore, and comparison panes

## Phase 02 --- Homepage

5.  Newspaper Homepage
6.  Daily Briefing
7.  Featured Story
8.  Supporting Story Cards
9.  Potential Blindspots
10. Philippine Coverage
10a. Magnified News --- Luzon/Visayas/Mindanao Top 5 (§18A)
11. My Area
12. Source Emphasis

## Phase 03 --- Explore

13. Explore Page
14. Topic Index
15. Region Index
16. Source Index
17. Language Index
18. Trending Topics

## Phase 04 --- Story

19. Story Header
20. What Happened
21. Timeline
22. Coverage Overview
23. Coverage Angles
24. Source Comparison
24a. Side-by-Side Comparison Mode (§21)
25. Evidence
26. Source List
26a. Ownership / Affiliation display (§23)
26b. Expert Commentary section, visually separated from reporting (§8)
26c. Related Stories rail (§21) --- timeline-ordered, confidence-gated
26d. "This doesn't belong here" mismatch flag on Coverage and Related
     Stories (§21), feeding the corrections process (§9)
27. Potential Blindspots

## Phase 05 --- Personalization

28. My Area
29. Saved Stories
30. Following
31. Language Preferences

## Phase 06 --- Mobile

32. Mobile Home
33. Mobile Explore
34. Mobile Story
35. Mobile Coverage
36. Mobile Blindspots
37. Mobile My Area
38. Mobile Search
39. Mobile Profile

------------------------------------------------------------------------

# 27. Editorial Principles

ALUNSINA NEWS should:

-   distinguish reporting from analysis
-   distinguish primary sources from secondary reporting
-   show where information comes from
-   expose differences in coverage
-   surface potentially missing coverage carefully
-   support multilingual Philippine reporting
-   make regional journalism more discoverable
-   avoid presenting political bias as an objective score
-   avoid telling users what political conclusion to reach
-   show evidence where available
-   clearly indicate uncertainty
-   timestamp developing information
-   disclose factual ownership/affiliation without editorializing about
    it (new)
-   flag social-media claims as unverified rather than ignoring or
    endorsing them (new)
-   always link out to original reporting rather than replacing it
    (new --- ties to §5A)

The platform's role is to improve the reader's information environment,
not to decide the reader's political position.

------------------------------------------------------------------------

# 28. Product Personality

ALUNSINA should feel:

**Editorial** - serious - refined - newspaper-like

**Intelligent** - analytical - organized - evidence-aware

**Philippine** - locally grounded - region-aware - multilingual

**Accessible** - easy to scan - understandable - not academic

**Trust-oriented** - transparent about sources - transparent about
limitations - careful with claims

------------------------------------------------------------------------

# 29. Core Brand Statement

Primary:

> **ALUNSINA NEWS**

> **Truth has more than one source.**

Supporting:

> **More context. A clearer picture.**

Product philosophy:

> **One story. Multiple sources. Fuller context.**

------------------------------------------------------------------------

# 30. Final Design Direction

The final interface should look like a **21st-century Philippine
newspaper redesigned for the information age**.

Think:

``` text
Traditional newspaper
        +
Ground News-style source comparison
        +
Philippine regional coverage
        +
Evidence tracing
        +
Modern digital discovery
```

The visual result should be editorial first, analytical second.

It should feel like opening a sophisticated newspaper --- then
discovering that every story can be opened, compared, traced, and
understood at a deeper level.

------------------------------------------------------------------------

# 31. Open Items & Parking Lot

An honest ledger of what this doc still doesn't resolve, so nothing
gets built on a silent assumption. Each of these is a real gap, not a
rejected idea --- they need a decision before the feature that depends
on them can actually ship.

## Foundational, blocks multiple features

-   **Account / identity system --- not yet decided.** Full accounts
    (email/OAuth) vs. a lighter anonymous/device-based model. This
    single decision blocks Saved Stories, Following, Notifications,
    Profile (§26 Phase 05), and whether "My Area" (§19) persists across
    devices or just lives in one browser/app install.
-   **Admin / editorial review interface --- not specified anywhere.**
    §8's contributor verification ("a reviewer checks...") and §21's
    "this doesn't belong here" corrections flag both assume a human
    reviews a queue, but no interface for that queue has been designed.
    For a solo developer this is arguably higher priority than any
    remaining reader-facing polish --- §8 and §9 cannot actually
    function without it.
-   **Notifications --- mentioned once (§13), never defined.** What
    triggers one (breaking news? a followed source posting? a reply to
    a correction flag?) is undecided and depends on the accounts
    decision above.

## Compliance, needs its own pass

-   **Philippine Data Privacy Act (RA 10173).** §8 collects identity,
    credentials, institutional affiliation, and conflict-of-interest
    disclosures from contributors --- that's personal data with
    National Privacy Commission obligations once processed at any
    real scale. Same category of "needs a real legal pass before
    launch" as the libel-law flag already in §8, not something to
    infer from this doc.

## Deliberately parked, not rejected

-   **Protected Submission / Tip Line.** Proposed as the accountable
    alternative to open anonymous posting; explicitly put on hold at
    the person's request rather than built out. Revisit if source
    protection for journalists under pressure becomes a priority.

## Minor, fine to leave for later

-   **Success metrics / analytics.** Nothing defines how you'd know
    Magnified News (§18A) or Blindspots (§7) are actually working ---
    engagement, corrections filed, outlet click-throughs, or something
    else. Not urgent for a first build, but worth deciding before
    investing further design effort in either feature.
