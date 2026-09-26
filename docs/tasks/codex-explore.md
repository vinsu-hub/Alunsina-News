# Task: Explore, Topics, Regions, Languages, Sources, Search, Blindspots, Methodology (Codex)

Read docs/tasks/_common.md first.

**Owns:** `app/explore/**`, `app/topics/**`, `app/regions/**`, `app/languages/**`, `app/sources/**`, `app/search/**`, `app/blindspots/**`, `app/methodology/**`, `components/explore/**`, `lib/queries/explore.ts`.

**State:** all routes exist and return 200, built by a previous agent that stopped just as it started the Methodology page. Treat everything as draft.

**Change:**
1. Audit each route against SPEC §8, §19, §22, §23, §24 and finish gaps. Explore needs sticky sub-nav (Topics · Regions · Sources · Languages · Blindspots · Saved), topic index with counts, regions (National/Luzon/Visayas/Mindanao + all region ids from `lib/taxonomy.ts` grouped by island), all 8 source types, all 9 languages, "01 Flood Control" trending list, and a Blindspots section (mobile's only route to blindspots).
2. `/methodology` must be complete and serious: sticky TOC; sections #how-stories (cite `CLUSTERING` from `lib/thresholds.ts`), #source-types (all 8 from taxonomy + how assigned + human review), #blindspots (render EVERY `BLINDSPOT_RULES[*].text` from `lib/thresholds.ts`, so the page always matches code), #ownership, #corrections (mailto + process + timeline), #linking (link-out policy, 2-sentence excerpts, data statuses), #principles (§26 list). Plain language.
3. `/regions/[id]` (islands + regions): mount `PhilippineCoverage` from `@/components/coverage/PhilippineCoverage` with that scope's coverage and platform-wide `compareTo`; "Compared with national average" block with clearly labelled baseline; local reporting (regional + community types only).
4. `/sources/[id]` Source Profile (§22): ownership + "Source of this information", data status explained + paywall tag, footprint, languages, topics, stories, recent articles with ReadOnPublisher, "Visit publisher ↗", "Report a miscategorization" → /methodology#corrections. No political score of any kind.
5. `/search`: Stories (not articles), example query chips, good empty/no-results states, GET form.
6. Newspaper-index visual quality: dense but calm, multi-column indexes, big serif numerals where ranked.

**Acceptance:** screenshots at 1440 and 390 for /explore, /methodology, /regions/luzon, /sources/sample-calabarzon, /search?q=rice, /blindspots; methodology shows all 8 blindspot rule texts; no horizontal scroll at 390; tsc + eslint clean on owned paths; every route 200 (plus /topics/environment, /regions/r4a, /languages/fil, /sources?type=regional, /blindspots?type=geographic, /search?q=zzzz).
