# W4b: Weekly trending keywords (Ground News-style) + registry fixes (Codex)

Read docs/tasks/_common.md and docs/DECISIONS.md first. NEVER use the production DATABASE_URL (run with `DATABASE_URL=`), never run vercel, don't commit.

## Context
The owner reviewed the live site and the server-PC ingest report:
- **Header wastes vertical space** at desktop: the stacked logo lockup + two tagline lines push the nav ~380px down. Reference (owner's mockup): one compact row: date left, **horizontal logo (emblem + "ALUNSINA NEWS" wordmark inline)** centered, search + EN + bell + icon right; nav row; trending row. Header total ≈ 180px.
- **Account icon confusion:** there are no accounts. The person icon opens `/settings` (device-only reader prefs). Owner chose: **replace it with a "For contributors" link → `/contribute`**; reader preferences move to a "Preferences" item (gear) in the mobile tab bar and footer.
- **Trending topics should work like Ground News:** instead of fixed categories, show **keywords/entities trending across the news market this week** (e.g. "Mary Jane Veloso", "BSKE", "Typhoon Queenie"), computed from coverage volume.
- **Server-PC ingest flagged registry problems:** GMA `gma-regional-amianan` / `gma-one-western-visayas` listing URLs soft-404 and fall back to unrelated content; `cebu-daily-news` lacks `collector: "agent-reach"` + `listingUrls`; `manila-standard` RSS now returns 403.


Another Codex worker (W4a) owns the rest of `components/layout/**` (Masthead, MobileTabBar, Footer) and `app/globals.css`.

## Task
Owns `ingest/**`, `config/feeds.ts`, `docs/INGEST_SOURCES.md`, `db/migrations/0006_trending_terms.sql` (+ `supabase/migrations/…0006…`), `lib/queries/trends.ts` (new), `app/trends/**` (new), `components/layout/TrendingTicker.tsx`, and the one trending line in `app/layout.tsx`. (W4a owns the rest of `components/layout/**`.)
1. **Migration 0006** `trending_terms(term text, slug text pk-part, window_start date, articles int, sources int, stories int, prev_articles int, score real, sample_story_ids jsonb, updated_at)`; RLS on + anon/authenticated revoked (0003 pattern).
2. **`ingest/trends.ts`**, run at the end of each ingest: over the last 7 days of non-social, non-hidden articles, extract candidate terms = named entities / capitalized phrases (reuse `entities()` and `bigrams()` from `ingest/text.ts`), plus acronyms (BSKE, DPWH). Filter: stopwords, publisher/outlet names (from `config/feeds.ts`), generic words ("Philippines", "Metro Manila", "President"), days of week. Merge variants (case, "PBBM"→ keep as-is, possessives). Require ≥3 distinct sources and ≥2 stories. Score = sources × log(1+articles) × growth vs previous 7 days. Keep the top 20.
3. **`lib/queries/trends.ts`**: `getTrendingTerms(limit)` → `{ term, slug, sources, stories, change: "new"|"up"|"steady" }[]`; fallback to `getTrendingTopics()` categories when the table is empty (fresh DB / sample).
4. **Ticker** (`components/layout/TrendingTicker.tsx`): label "TRENDING THIS WEEK →", chips = trending terms linking to `/trends/<slug>`, small ↑/NEW markers; "Topics →" link at the end to `/topics` (categories stay in Explore/Topics). `app/layout.tsx` passes the terms (one-line change; W4b owns it for that line only).
5. **`/trends/[slug]`**: term header, "N sources · M stories this week", stories list (StoryCard + CoverageChip) whose articles mention the term; `/trends` index = ranked list "01 Mary Jane Veloso ↑" (volume only, no political framing, same principle as Explore trending).
6. **Registry fixes** in `config/feeds.ts` + `docs/INGEST_SOURCES.md`:
   - `gma-regional-amianan`, `gma-one-western-visayas`: find the real GMA Regional TV listing URLs (e.g. `gmanetwork.com/regionaltv/news/...` section pages); if no stable desk URL returns desk-specific items, **remove `collector`** and mark `feeds: []`, `verified:false`, note "no stable desk listing; covered via GMA network RSS". Don't leave soft-404 URLs.
   - `cebu-daily-news`: add `collector: "agent-reach"`, `listingUrls: ["https://cebudailynews.inquirer.net/"]` (+ a latest/news section URL if found).
   - `manila-standard`: RSS 403 → re-probe with the honest UA; if still 403, set `feeds: []`, `collector: "agent-reach"`, `listingUrls: ["https://manilastandard.net/"]`.
7. Seed: a few sample `trending_terms` rows so dev/sample edition shows chips.


## Acceptance
tsc + eslint clean on owned paths; unit test for `ingest/trends.ts` with fixture headlines (outlet names, 'Philippines', weekdays excluded; the ≥3-sources and ≥2-stories rules enforced); `DATABASE_URL= ALUNSINA_PGLITE_DIR=data/pglite-w4b npm run ingest -- --no-llm` completes and reports the top terms; `/`, `/trends`, `/trends/<slug>` 200 on the sample DB (chips visible); `npm run check-feeds -- --probe` evidence for each registry fix in `docs/INGEST_SOURCES.md`; migration + Supabase copy with RLS (don't apply to production).
