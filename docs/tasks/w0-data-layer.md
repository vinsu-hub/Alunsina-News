# Wave 0: Postgres data layer + schema for the v2.1 features (Codex)

Read docs/tasks/_common.md first. You are the ONLY worker running right now, so you may edit any file needed for this task. Other workers start after you finish and will build on your API, so make it clean.

## Why
Hosting target is Supabase Postgres + Vercel (docs/DECISIONS.md). Today the app uses Node's built-in `node:sqlite` with SYNCHRONOUS queries (`db/client.ts`, `lib/queries.ts`, `lib/queries/*.ts`, `ingest/*.ts`, `db/seed.ts`). Vercel can't keep a SQLite file, and Postgres drivers are async.

## Change
1. **DB client (`db/client.ts`)**: replace `node:sqlite` with an async Postgres client that uses:
   - `postgres` (porsager/postgres.js) when `DATABASE_URL` is set (Supabase; use `prepare: false` for the Supabase transaction pooler, `ssl: 'require'` unless the URL is localhost);
   - `@electric-sql/pglite` otherwise, persisted at `data/pglite/` (dev + tests, no Docker needed).
   Expose one small interface, e.g. `db.query<T>(sql, params)`, `db.one<T>()`, `db.tx(async (t) => …)`, with `$1…$n` placeholders. Keep a globalThis singleton for Next dev HMR. Install the deps with npm.
2. **Schema as migrations**: `db/migrations/0001_init.sql` (Postgres DDL for every existing table: sources, stories, articles, story_emphasis, story_angles, blindspots, timeline_events, evidence, fact_checks, ingest_runs; use `jsonb` for the array columns, `timestamptz` for times, proper FKs/indexes), plus `db/migrations/0002_v21.sql` adding:
   - `articles.image_url text`, `articles.image_credit text` (publisher name). Nullable.
   - Source type value `journalist` (Independent Journalist). Type is text; just make sure nothing rejects it.
   - `contributors` (id slug pk, name, kind 'journalist'|'expert', field (Political Science, Public Administration/Governance, Economics, Law, Environment/Climate Policy, Public Health), credentials, affiliation, conflicts jsonb (declared conflicts, strings), bio, portfolio_url, is_sample bool, created_at).
   - `commentary` (id, story_id fk, contributor_id fk, title, body (≤ 1200 chars, original content hosted by ALUNSINA), published_at, is_sample bool).
   - `story_links` (story_id, related_story_id, relation 'earlier'|'later'|'developing', confidence real, created_at, pk(story_id, related_story_id)). Only confidence ≥ 0.6 is ever shown.
   - `flags` (id, kind 'coverage_mismatch'|'related_mismatch'|'source_miscategorized', story_id, target_id text, note text ≤ 500, created_at, status 'open' default). Corrections queue, no admin UI yet.
   - `newsletter_signups` (email unique, created_at, confirmed bool default false).
   A tiny migration runner (`db/migrate.ts`, `npm run migrate`) that records applied files in `schema_migrations` and runs automatically on first `getDb()` in dev (PGlite) but only via `npm run migrate` against `DATABASE_URL`. Also emit `supabase/migrations/` copies (same SQL, Supabase CLI naming) so `supabase db push` works later.
3. **Async query layer**: make every exported function in `lib/queries.ts` and `lib/queries/*.ts` async and port SQL to Postgres (`$n` params, `jsonb` parsing is automatic, `ILIKE` for search, `now() - interval`, `COUNT(*)::int`). Keep the exact same exported names and return types (`lib/types.ts`), adding `imageUrl`/`imageCredit` to `Article`, `leadImage: { url, credit } | null` to `StorySummary` (the first article with an image, preferring national/regional/independent), and new types + queries:
   - `listContributors({ kind?, field? })`, `getContributor(id)` (with their commentary), `getStoryCommentary(storyId)`;
   - `getRelatedStories(storyId)` (confidence ≥ 0.6, ordered by time, with a relation label);
   - `getMagnifiedNews(island: 'luzon'|'visayas'|'mindanao', limit = 5)` implementing the Master spec §11 rules: rank by distinct independent/regional/community sources + recency + distinct localities (regions) touched, never purchasable, and **at least 2 of 5 Luzon slots reserved for non-NCR stories** when qualifying stories exist. Each entry has an attributed byline (lead outlet name or contributor) and a coverage chip stat.
   - `createFlag(input)`, `addNewsletterSignup(email)` (validate email; idempotent).
4. **Update every call site** to `await` (all server components, route handlers, `components/layout/Footer.tsx`, `components/layout/SampleBanner.tsx`, `components/explore/RegionComparisonBlock.tsx`, `components/home/MyAreaTeaser.tsx` via its API, `app/layout.tsx`, etc.). Pages stay Server Components; don't move data fetching to the client.
5. **Ingest (`ingest/*.ts`) and seed (`db/seed.ts`)** ported to the async client with transactions. In `ingest/fetch.ts` also extract the item image: `media:content`/`media:thumbnail` url, `enclosure` with an image MIME type, or the first `<img src>` in `content:encoded`/`content`; absolute http(s) only. Store `image_url` + `image_credit` = source name (configure rss-parser `customFields`). Seed: add 4 sample contributors (2 experts, 2 independent journalists, all names obviously fictional and marked "(sample)"), 3 sample commentary pieces on the flood and rice stories, 1 sample `journalist`-type source with 2 articles, and a few `story_links` between sample stories. Sample images stay null (placeholders).
6. **Taxonomy** (`lib/taxonomy.ts`): add `{ id: "journalist", label: "Independent Journalist", short: "Journalist", description: "An individual reporter, verified by identity and portfolio, publishing original reporting." }` as the 9th source type (after independent). Update `SOURCE_TYPE_COLORS` to the brief's muted information signals: government dark green `#1F4D3A`, primary `#0F2F27`, state `#5B6F63`, national muted blue `#3E5C7A`, regional terracotta `#B4513D`, independent muted purple `#6B5A7E`, journalist `#8A6F9E`, community muted teal `#3F7A78`, social warm gray `#B9B3A5`. Add `EXPERT_FIELDS` constant.
7. **Docs**: update `docs/BUILD_BRIEF.md` (async API, new queries/types, how to run migrate/seed/ingest, PGlite vs DATABASE_URL). Add `.env.example` with DATABASE_URL, INGEST_TOKEN, ANTHROPIC_API_KEY (empty values). Add `data/pglite/` to .gitignore.
8. Remove `node:sqlite` usage entirely.

## Constraints
- Don't change any page's visual design in this task (other workers are redesigning right after you). Only make them async-correct.
- Keep `npm run seed`, `npm run ingest [--dry-run] [--no-llm]`, `POST /api/ingest` working.
- After you finish: `npm run seed` must produce the sample edition in PGlite, and every route must render it.

## Acceptance
- `npx tsc --noEmit` and `npx eslint .` clean; `grep -r "node:sqlite"` returns nothing.
- `npm run migrate && npm run seed` works on a fresh `data/pglite/`.
- `ALUNSINA_PGLITE_DIR=data/pglite-live npm run ingest -- --no-llm` (or equivalent env override you document) completes against live feeds and stores image_url for a meaningful share of articles; report the count.
- With the dev server on the seeded DB, all of these return 200: `/`, `/design`, `/story/metro-manila-lgus-prepare-flooding`, `/story/metro-manila-lgus-prepare-flooding?compare=1`, `/explore`, `/topics/environment`, `/regions/luzon`, `/regions/r4a`, `/languages/fil`, `/sources`, `/sources/sample-calabarzon`, `/search?q=rice`, `/blindspots`, `/methodology`, `/my-area`, `/saved`, `/settings`, `/api/places?q=san`, `/api/area/r4a`; `/story/nope` → 404.
- A short node script `scripts/smoke-queries.ts` calling every exported query once (incl. the new ones) exits 0.
