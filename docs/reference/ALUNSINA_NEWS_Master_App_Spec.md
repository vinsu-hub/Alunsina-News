# ALUNSINA NEWS --- Master App Specification

> This is the **build-ready spec**: what exists, per tab/screen, what's
> on it, and how it behaves. For the reasoning behind each decision,
> see `ALUNSINA_NEWS_Product_Context_v2.md` --- that doc is the
> rationale/audit trail; this one is the thing to build from.
>
> Section numbers here are independent of that doc's numbering.

------------------------------------------------------------------------

## 0. App Identity

-   **Name:** ALUNSINA NEWS. Never shortened to an acronym in the UI.
-   **Tagline:** "Truth has more than one source."
-   **Supporting line:** "More context. A clearer picture."
-   **Philosophy line:** "One story. Multiple sources. Fuller context."
-   **Positioning:** a Philippine news intelligence and comparison
    platform --- Ground News's model (compare coverage across sources
    on one event) adapted to the PH media landscape, where the more
    useful axis is institutional distance/reach (government ↔
    independent, Metro Manila ↔ regional, English ↔ Filipino/regional
    language) rather than political left/right.
-   **Personality:** Editorial · Intelligent · Philippine · Accessible
    · Trust-oriented. Feels like a newspaper first, an analytics tool
    second. Never a SaaS dashboard.

------------------------------------------------------------------------

## 1. Visual Foundation

**Style:** digital Philippine newspaper + editorial intelligence
layer. Ground News-style information density, newspaper front-page
structure, editorial typography, thin divider rules, multi-column
layouts, strong headlines, compact metadata, restrained cards,
generous but controlled whitespace.

**Avoid:** generic SaaS dashboard look, excessive rounded cards, neon
colors, gradients, futuristic UI chrome, political color-coding,
simplistic bias meters.

**Color system:**

| Role | Name | Hex |
|---|---|---|
| Background | Paper / Cream | `#F4F1E8` |
| Text | Ink | `#1E211E` |
| Brand | Deep Forest Green | `#123F35` |
| Brand (dark) | Deep Forest | `#092D27` |
| Accent | Muted Terracotta | `#B4513D` |
| Accent 2 | Ochre | `#C49A45` |
| Rules/borders | Warm Gray | `#C9C5B9` |

Colors stay restrained and editorial --- no political meaning is ever
assigned to a color.

**Typography:**

-   Headlines: an editorial serif --- Newsreader, Source Serif,
    Cormorant, or Instrument Serif.
-   Interface/metadata: a clean sans --- Inter, Geist, or Manrope.

**One shared component, used everywhere below:**

> **Coverage Chip** --- e.g. `"12 sources · view coverage"`. Attached
> to every place a single article/headline appears anywhere in the
> app (Daily Briefing row, Top News card, search result, Magnified
> News entry, comparison pane). Tapping it always opens that
> article's Story page. Build this once as a shared component --- do
> not reimplement it per screen.

------------------------------------------------------------------------

## 2. Global Navigation --- Desktop

**Top bar (masthead):**

```
Left: PHILIPPINES · DAILY EDITION · [today's date]
Center: ALUNSINA NEWS
Below masthead: ANALYZE · SOURCES · INSIGHTS · NAVIGATE
Right: Search · Language · Notifications · Profile
```

**Main navigation:**

```
Home · Explore · My Area · Topics · Regions · Sources · Blindspots
```

**Trending ticker** (below main nav):

```
TRENDING TOPICS →
Government · Economy · Education · Health · Environment · Transport ·
Business · Agriculture · Technology · Climate
```

------------------------------------------------------------------------

## 3. Global Navigation --- Mobile

**Bottom nav:** `Home · Explore · My Area · Saved · Profile`

Blindspots has no dedicated bottom-nav slot (five is the ceiling
before it crowds); it's reachable two ways instead:

-   As a section inside **Explore**.
-   Per-story, since every Story page carries its own Blindspots
    block regardless of platform.

**Mobile Story page priority order** (top to bottom): headline →
summary → source count → coverage → perspectives → evidence →
blindspots. Never let mobile become a dense analytics dashboard ---
this is a reading experience first.

------------------------------------------------------------------------

## 4. TAB: Home

Feels like a newspaper front page. No marketing hero --- users see news
immediately.

**Structure, top to bottom:**

```
MASTHEAD
MAIN NAVIGATION
TRENDING TOPICS
┌──────────────┬──────────────────────────┬────────────────┐
│ DAILY        │ FEATURED / LEAD STORY    │ POTENTIAL      │
│ BRIEFING     │                          │ BLINDSPOTS     │
└──────────────┴──────────────────────────┴────────────────┘
FEATURED STORY CARDS
WHAT SOURCES ARE EMPHASIZING  (tied to the Featured Story, labeled "On: [headline]")
PHILIPPINE COVERAGE  +  MAGNIFIED NEWS  (Luzon / Visayas / Mindanao tabs)
MY AREA (preview)
TOP NEWS STORIES
FOOTER
```

**Daily Briefing (left column):**

-   Header stat: `"5 stories · ~5 min read"` only --- never mix in a
    platform-wide article count on this line.
-   5 compact items, each with: category, headline, source count,
    regions, languages, time (e.g. `18 sources · 7 regions · 3
    languages`). This stat line is the Coverage Chip --- tappable,
    jumps to that Story.

**Featured Story (center):**

-   One lead story, image, `DEVELOPING` tag when applicable, headline,
    2-sentence dek, Coverage Chip stat line, "Updated [time]."
-   Below it: 3 Featured Story Cards (economy/education/environment
    style secondary stories), each with category tag, headline, dek,
    Coverage Chip line.

**Potential Blindspots (right column):**

-   Up to 4 cards, each tied to a **real, current example** --- never
    generic. Format:
    ```
    Geographic
    Most coverage of the flooding story comes from Metro Manila. Few
    reports found from Rizal or Bulacan, which are also affected.
    → See coverage by region
    ```
-   If a blindspot type has no current example, hide it or say so ---
    never show boilerplate with nothing behind it.
-   **This rail stays ad-free.** Ads, if used, go in a separate
    placement between Featured Story Cards and Top News Stories, never
    inside Blindspots / Philippine Coverage / My Area.

**What Sources Are Emphasizing:**

-   Always headed `"On: [story headline]"` --- never floats unlabeled.
-   A horizontal stacked coverage bar first (share of sources per
    type, e.g. `5 Government · 6 National · 4 Regional · 3
    Independent`), then category breakdown lists (Government
    Statement / National Media / Regional Media / Independent /
    Social-Viral-when-applicable), each with 2--3 short emphasis
    bullets.

**Philippine Coverage + Magnified News:**

-   A Philippines map, default zoom = island groups (Luzon 61% /
    Visayas 24% / Mindanao 15%), click-through to region level (NCR,
    CAR, Region I, etc.) --- same underlying region data as Explore, not
    a separate system.
-   Magnified News module, 3 tabs (Luzon / Visayas / Mindanao), Top 5
    per tab, refreshed daily. Full spec in §11 below.

**My Area (preview):** location name, 3 stat counts (local / regional
/ government-update story counts), 2--3 latest local story lines,
"Change location →" link, "View all local stories →" link.

**Top News Stories:** a wider grid of additional stories below the
fold, same card format as Featured Story Cards.

------------------------------------------------------------------------

## 5. TAB: Explore

A newspaper index + discovery system. Sub-navigation:

```
Topics · Regions · Sources · Languages · Experts & Commentary · Saved
```

**Topic Index:** Government, Economy, Education, Health, Environment,
Transport, Business, Agriculture, Technology, Climate --- each a
clickable index into that topic's stories.

**Regions:** National, Luzon, Visayas, Mindanao, then full region
breakdown (NCR, CAR, Region I, Region II, ...). Same drill-down system
as the homepage map.

**Sources** --- browse by the nine-type taxonomy:

```
National Media · Regional Media · Primary Document · Government
Statement · State-Run Media · Independent · Independent Journalist ·
Community · Social / Viral
```

**Experts & Commentary** --- a separate index from Sources (analysis,
not reporting). Browse by field:

```
Political Science · Public Administration/Governance · Economics ·
Law · Environment/Climate Policy · Public Health
```

Each entry links to a contributor profile (credentials, affiliation,
declared conflicts, recent commentary --- same layout family as Source
Profiles). This is also where mobile users reach Blindspots.

**Languages:** English, Filipino, Cebuano, Ilocano, Hiligaynon,
Kapampangan, Waray, Bikol, Other Philippine Languages.

**Trending Topics:** ranked-by-volume list (`01 Flood Control, 02 Rice
Prices, ...`) --- volume ranking only, never framed as a
recommendation or endorsement.

------------------------------------------------------------------------

## 6. TAB: My Area

Feels like a **local newspaper insert**, not a generic location
dashboard.

**Empty state (no location set):** "Set your area to see local
coverage" + a city/municipality search field + optional "Use my
current location" button. City/municipality granularity only --- never
ask for a street address; this is a news feed, not a delivery app.

**Populated state:**

```
MY AREA
[City] · [Province]

12 Local stories · 27 Regional stories · 8 Government updates

Latest local stories:
- [story] · [time] · [category]
- [story] · [time] · [category]
- [story] · [time] · [category]

Change location →
View all local stories →
```

Shows: local stories, regional stories, government updates, community
reports, local events, local source coverage.

------------------------------------------------------------------------

## 7. Story Detail Page

The central intelligence experience --- opened from any Coverage Chip
anywhere in the app.

**Full vertical structure:**

```
STORY HEADER            (headline, dek, Coverage Chip stat line, DEVELOPING tag if applicable,
                          "Compare coverage" toggle for Side-by-Side mode)
WHAT HAPPENED            (plain-language summary)
STORY TIMELINE            (chronological: government statement → national → regional → local → docs)
COVERAGE                  (regions / publishers / languages / source types / timing)
WHAT SOURCES EMPHASIZE    (coverage bar + category breakdown, same component as Home §4)
COVERAGE ANGLES
EVIDENCE / PRIMARY SOURCES
EXPERT COMMENTARY         (visually distinct card treatment, permanent label "Analysis --- Not
                           Reporting"; contributor byline + credentials + declared conflicts
                           shown inline; show more than one contributor when available)
RELATED STORIES           (timeline-ordered rail: "← 2 days ago: ..." / "→ Developing: ...";
                           confidence-gated --- low-confidence links simply don't appear)
SOURCE LIST                (every source, tagged by type)
POTENTIAL BLINDSPOTS
```

**Side-by-side Comparison Mode** (reached via the Story Header
toggle): two or more panes (desktop) open side by side, each showing
one source's headline + excerpt + "Read on [Publisher] →" (full text
always stays on the publisher's site --- ALUNSINA never mirrors full
articles). A source-type picker above each pane swaps in a different
source without leaving the view. On mobile this becomes a swipeable
single-column sequence instead of side-by-side panes.

**Mismatch flag:** both Coverage and Related Stories carry a
user-facing "this doesn't belong here" flag, feeding the corrections
process described on the Methodology page (§13 below).

------------------------------------------------------------------------

## 8. Source Profile Page

```
SOURCE
[Publisher Name]

Type:            [one of the 9 taxonomy types]
Ownership:       [factual, no editorializing --- "Independently owned" /
                  parent company / conglomerate / govt affiliation]
Data status:     Data Partner | Public feed | Headline + link only
Primary regions: [region list]
Languages:       [language list]
Topics:          [topic tags]

Stories covered · Primary-source links · Recent articles · Coverage footprint
```

Never reduces a publisher to a single political score --- ownership and
data status are shown as facts, not judgments.

------------------------------------------------------------------------

## 9. Contributor Profile Page (Independent Journalists & Expert Contributors)

Same layout family as Source Profiles, plus:

-   Real name, credentials/institutional affiliation
-   **Declared conflicts of interest** (party membership, paid
    consulting, board seats, government appointments) --- shown
    publicly and inline, not buried
-   Contribution history (their published commentary/reporting on the
    platform)
-   For Independent Journalists: portfolio/byline history in place of
    institutional affiliation

**Submission flow (Independent Journalist / Expert Contributor
application):**

1.  Applicant submits: real identity, area of expertise or portfolio,
    institutional affiliation (if any), declared conflicts of interest.
2.  Automated pre-screen (jailbreak/injection + toxicity/threats check
    --- see §14 Runtime Architecture) runs before anything reaches a
    human.
3.  A human reviewer checks **identity and expertise only** --- never
    political alignment. Approval/rejection reasons unrelated to
    viewpoint must be documented.
4.  Approved contributors get a profile page (above) and can submit
    Expert Commentary attached to a Story, or --- for Independent
    Journalists --- original reporting that appears in that Story's
    Source List.

*(Note: the interface a reviewer actually uses to work this queue is
not yet designed --- see Open Items, §16.)*

------------------------------------------------------------------------

## 10. Search

Returns **Stories**, not isolated articles.

```
STORY
[Headline]

18 sources · 7 regions · 4 languages   ← Coverage Chip, same component as everywhere else
Latest update: 2h ago
```

Opening a result goes to the Story Detail Page, where individual
articles/sources can be inspected.

------------------------------------------------------------------------

## 11. Magnified News (Luzon / Visayas / Mindanao Top 5)

**Where it lives:** homepage module (§4) + Explore → Regions "editor's
picks" layer (§5).

**Purpose:** (1) counter the Metro-Manila-centric blindspot by giving
readers a fast way into what's happening in other island groups, (2)
give regional/community/Independent Journalist sources earned
discovery placement.

**Selection rules --- build these as hard constraints, not suggestions:**

-   Placement can **never be purchased**. Any future sponsored content
    is labeled "Sponsored" and kept structurally separate from this
    leaderboard.
-   Ranking signals: number of independent sources reporting, recency,
    number of distinct localities touched, reader engagement measured
    *within that region's own My Area users* (not platform-wide
    traffic, or Manila-adjacent stories dominate every list).
-   At least **2 of the 5 Luzon slots reserved for non-NCR regions**
    when qualifying stories exist.
-   Every entry carries a **real, attributed byline** --- outlet or
    Independent Journalist, never anonymous. This is what actually
    delivers the placement/discovery benefit.

```
MAGNIFIED NEWS --- VISAYAS
Top 5 today

1. Cebu port congestion delays inter-island cargo
   Sun.Star Cebu · 6 sources · 3 provinces
2. Bohol farmers report early dry spell effects on rice yield
   Bohol Chronicle · Independent Journalist byline · 2 sources
...
```

------------------------------------------------------------------------

## 12. Cross-Cutting Systems (used by multiple screens above)

**Source-type taxonomy (9 types)** --- used in Explore, Story Detail
Source List, Source Profiles, and Magnified News bylines:

```
Primary Document · Government Statement · State-Run Media ·
National Media · Regional Media · Independent · Independent
Journalist · Community · Social / Viral
```

**Blindspot types (8)** --- used on Home and every Story page:

```
Geographic · Language · Source · Evidence · Timing · Local ·
Topic/Angle · Social/Misinformation
```

Every blindspot is labeled "Potential Blindspot," never asserted as
fact, and always explains *why* it was detected.

**Coverage vs. Related Stories** --- two different relationships,
never conflated:

-   *Coverage* = different outlets reporting the **same event**.
-   *Related Stories* = different Stories that are part of the
    **same ongoing situation over time** (what "DEVELOPING" cashes
    out to).

Both are confidence-gated: low-confidence matches don't appear rather
than appearing wrong, and both carry the "this doesn't belong here"
correction flag.

------------------------------------------------------------------------

## 13. Methodology & Trust Page

A public, permanently-linked page (footer + Sources nav). Must plainly
explain, in non-technical language:

-   how articles get grouped into a Story, and separately, how
    Stories get linked as Related Stories --- two different judgment
    calls, both flagged as capable of being wrong
-   how a source gets assigned a type, and who reviews that assignment
-   what threshold triggers a Potential Blindspot
-   how ownership/affiliation data is sourced and kept current
-   the corrections process --- how a user flags a miscategorized
    source or wrongly-clustered/wrongly-linked story, and how that
    gets resolved
-   a plain statement that ALUNSINA links out to original reporting
    rather than republishing it

------------------------------------------------------------------------

## 14. Content Sourcing Rules (governs what any screen is allowed to show)

-   **Aggregation only** --- headline, byline/publisher, timestamp,
    short fair-use excerpt, canonical link out, detected
    language/region/source-type. Never mirror full article text
    unless a publisher has explicitly licensed it.
-   **Ingestion tiers, in order of ease:** RSS/public feeds → official
    public statements (PCOO, agency pages, Official Gazette, LGU
    pages) → direct data-partnership outlets → licensed national
    outlets (pursued once there's traction to negotiate from).
-   Every article-level card needs a "Read on [Publisher] →" action.
    Paywalled sources carry a "Subscription required" tag.
-   Social/Viral ingestion (X/Facebook/TikTok) is a later phase --- read
    access to X's API is a real ongoing cost, not free; don't build
    against it for v1.

------------------------------------------------------------------------

## 15. Runtime Architecture (how it actually runs)

```
1. INGEST      (hourly)      → RSS/public feeds only (§14)
2. CLUSTER     (each cycle)  → group same-event articles into a Story
3. SYNTHESIZE  (Claude API)  → summaries, source tagging, blindspots,
                                 Magnified News ranking
4. STORE                     → database, not source files
5. SERVE                     → site reads from the database; no
                                 rebuild/redeploy needed on data change
```

-   **MVP hosting:** GitHub Actions cron (free) → committed JSON →
    static site build.
-   **Scaled hosting:** Supabase/Postgres (free tier) → dynamically
    rendered site (Vercel free tier) --- data updates need no rebuild.
-   **Content is data, not code.** The recurring job updates rows/JSON;
    it should never be rewriting the site's own source files on a
    schedule. Claude Code is for developing the app; the Claude API is
    for the recurring content pipeline --- keep those two uses separate.
-   **Model split:** Claude (Haiku for cheap classification/tagging,
    Sonnet for synthesis/writing) does all reasoning and text
    generation. A fast typed-decision classifier (Laya/Jev-style, added
    later once there's labeled data to fine-tune it on) can pre-screen
    duplicates and moderate contributor submissions before a human or
    Claude sees them --- optional, not required for v1.
-   **Cost levers:** prompt caching (taxonomy/instructions are
    identical every call within a cycle) and the Batch API (flat
    discount, fits a 12-hour cycle naturally). Confirm current rates on
    Anthropic's pricing page before budgeting.

------------------------------------------------------------------------

## 16. Editorial Principles (non-negotiable, apply to every screen above)

-   Distinguish reporting from analysis, and primary sources from
    secondary reporting.
-   Always show where information comes from.
-   Expose differences in coverage; surface missing coverage carefully
    ("Potential," never asserted as fact).
-   Support multilingual Philippine reporting; make regional
    journalism discoverable.
-   Never present political bias as an objective score, and never tell
    the reader what political conclusion to reach.
-   Disclose ownership/affiliation factually, without editorializing.
-   Flag social-media claims as unverified rather than ignoring or
    endorsing them.
-   Always link out to original reporting rather than replacing it.
-   Show evidence where available; clearly indicate uncertainty;
    timestamp developing information.

------------------------------------------------------------------------

## 17. Open Items --- Do Not Build On Assumption

These are real, unresolved gaps. Don't invent an answer for them while
building --- flag back instead.

-   **Account/identity system** --- not decided (full accounts vs.
    lightweight/anonymous/device-based). Blocks Saved Stories,
    Following, Notifications, Profile, and whether My Area persists
    across devices.
-   **Admin/editorial review interface** --- not designed at all.
    Needed to actually operate the contributor-verification queue (§9)
    and the "this doesn't belong here" corrections queue (§7, §13).
    Likely a higher build priority than remaining reader-facing polish.
-   **Notifications** --- appears in the header, trigger logic never
    defined.
-   **Philippine Data Privacy Act (RA 10173)** compliance for
    contributor identity/credential data --- needs its own legal pass.
-   **Protected Submission/Tip Line** --- parked at the product
    owner's request, not rejected; revisit later.
-   **Success metrics/analytics** --- not defined for Magnified News or
    Blindspots. Fine to leave for later.
