# Build brief for parallel agents

Read `docs/SPEC.md` (product requirements) and `AGENTS.md` (this is Next.js 16 — check `node_modules/next/dist/docs/` before using an API you're unsure of; `params`/`searchParams` are Promises; `PageProps<'/route/[x]'>` is global).

## Data layer and local setup

The data layer is async Postgres. With `DATABASE_URL` unset, `getDb()` opens an embedded PGlite database persisted at `data/pglite/` and automatically applies `db/migrations/*.sql`. Set `ALUNSINA_PGLITE_DIR` to use a separate local database. With `DATABASE_URL` set, the same API uses postgres.js; run migrations explicitly before serving or ingesting. Supabase transaction pooling uses `prepare: false` and TLS, except localhost connections.

```sh
npm ci
npm run migrate       # applies and records migrations; safe to repeat
npm run seed          # replaces the edition with fictional sample content
npx next typegen
npm run dev -- -p 3100
```

PGlite has one owning process per directory: stop the dev server before running seed/migrate/ingest against its directory, or use a separate `ALUNSINA_PGLITE_DIR`. Use `DATABASE_URL` for shared/multi-process deployments. Existing local SQLite files are not migrated; seed or ingest a fresh edition instead.

```sh
ALUNSINA_PGLITE_DIR=data/pglite-live npm run ingest -- --no-llm
npm run ingest -- --dry-run --no-llm  # rolls back all edition writes
NODE_OPTIONS=--conditions=react-server npx tsx scripts/smoke-queries.ts
```

The smoke script expects a seeded edition; use a separate seeded directory if Next dev is running. The `react-server` condition enables imports protected by `server-only` in a Node smoke process. In production, configure `DATABASE_URL` and `INGEST_TOKEN`; cron calls `POST /api/ingest` with `Authorization: Bearer $INGEST_TOKEN`. `ANTHROPIC_API_KEY` enables the optional writing pass (Sonnet, `claude-sonnet-5`); omit it or pass `--no-llm` for deterministic local ingestion. Classification remains heuristic in this wave; the configured future classification model is Haiku (`claude-haiku-4-5`).

`db/client.ts` exposes `await getDb()` → `Db`, with `query<T>(sql, params)`, `one<T>(sql, params)`, `execute(sql, params)` (affected row count), `exec(sql)` (DDL/multiple statements), and `tx(async (t) => ...)`. Always bind user values with `$1…$n`; use the transaction-scoped client inside the callback. JSONB arrays are decoded by the driver and timestamps become ISO strings. No synchronous database calls are supported. Keep database reads in Server Components and route handlers; every query function listed below returns a Promise.

The canonical migrations also have identical Supabase CLI copies under `supabase/migrations/`. For a new Supabase database, choose `npm run migrate` or `supabase db push` as the migration owner; do not mix tracking systems on the same database without baselining the already-applied files.

## Shared foundation — use it, don't fork it
| Path | What |
|---|---|
| `lib/taxonomy.ts` | 9 source types + colors, `EXPERT_FIELDS`, 8 blindspot types, topics, regions/island groups, languages, data statuses |
| `lib/types.ts` | `StorySummary`, `StoryDetail`, `Source`, `Article`, `Blindspot`, `IslandCoverage`, `Edition`, `SourceProfile`, `Contributor`, `ContributorProfile`, `Commentary`, `RelatedStory`, `MagnifiedNewsEntry`, `FlagInput`, `Flag`, `NewsletterSignup` |
| `lib/queries.ts` | `getEdition`, `getStory`, `listStories(filter)`, `listBlindspots`, `currentBlindspotsByType`, `listSources`, `getSource`, `search`, `getRegionCoverage`, `getTrendingTopics`, `getPlatformStats`, `getAreaFeed`, `getLastIngest`, `listContributors`, `getContributor`, `getStoryCommentary`, `getRelatedStories`, `getMagnifiedNews`, `createFlag`, `addNewsletterSignup` |
| `lib/thresholds.ts` | clustering + blindspot thresholds (ingestion implements, Methodology displays) |
| `lib/gazetteer.ts` | provinces/cities → region, `searchPlaces`, `nearestPlace`, `placeKey` |
| `lib/format.ts` | `timeAgo`, `editionDate`, `clockTime`, `pct`, `plural`, `briefingReadTime` |
| `lib/prefs.ts` | client `usePref(key, fallback)` + `PREF_KEYS` (saved, following, area, languages) |
| `components/ui` | `Rule`, `SectionHead`, `Kicker`, `StatusKicker`, `MetaLine`, `SourceTypeBadge`, `ReadOnPublisher`, `SubscriptionTag`, `CoverageBar`, `CoverageBreakdown`, `StoryCard`, `SaveButton`, `Icon` |
| `components/layout` | Masthead, MainNav, TrendingTicker, Footer, MobileTabBar, SampleBanner (already in `app/layout.tsx`) |
| `/design` | renders every primitive — look at it first |

CSS utilities in `app/globals.css`: `kicker`, `section-head`, `headline`, `meta`, `link-quiet`, `no-scrollbar`. Tailwind colors: `paper`, `paper-deep`, `ink`, `ink-soft`, `ink-muted`, `forest`, `forest-dark`, `terracotta`, `ochre`, `rule`. Fonts: `font-serif` (Newsreader), `font-sans` (Inter). Page container: `mx-auto max-w-[1280px] px-4 md:px-6`.

## Ownership rules (to keep merges clean)
- **Only edit files inside your owned paths.** Do not edit `lib/taxonomy.ts`, `lib/types.ts`, `lib/queries.ts`, `db/*`, `app/layout.tsx`, `app/globals.css`, `components/ui/*`, `components/layout/*`.
- Need a new query? Put it in `lib/queries/<your-area>.ts` (await `getDb()` from `@/db/client`, use `$n` parameters, and add `import "server-only"`). Need a new UI primitive? Put it in your own components folder.
- If a shared file truly must change, don't change it — list the exact change in your final report and work around it.
- Server Components by default; `"use client"` only for interactive islands.

## Quality bar
- Editorial newspaper look: serif headlines, thin rules, multi-column, compact meta, square corners (≤2px radius), no drop shadows, no gradients, no political colors.
- Works at 390px (no horizontal page scroll; 16px gutter) and 1440px. Bottom tab bar is fixed on mobile — pages already get bottom padding from the footer.
- Always "Potential Blindspot" with a reason. Always "Read on [Publisher] ↗" for outbound; never render full article text.
- Accessible: semantic headings, labelled buttons, keyboard-operable toggles, `aria-expanded`/`aria-pressed` where relevant.
- Before finishing: `npx tsc --noEmit`, `npx eslint <your paths>`, and load your routes in the dev server (curl for 200 + no errors in the dev log). Do not commit; the coordinator commits after reviewing the work.

## Final report (keep it short)
Routes/files added, anything you couldn't finish, and any requested change to shared files (exact diff).

## v2.1 data contracts

- `Article.imageUrl` / `imageCredit` are nullable publisher RSS images. `StorySummary.leadImage` is `{ url, credit } | null`, selected from the first imaged article while preferring national/regional/independent outlets. Always show `Photo: [Publisher]`; a missing image gets a topic placeholder. Seed images remain null.
- `listContributors({ kind?, field? })`, `getContributor(id)` (including commentary), and `getStoryCommentary(storyId)` return signed contributor data. Commentary carries `label: "Analysis — Not Reporting"`, has at most 1200 characters, and never changes source counts. All seeded contributors/commentary are fictional and `isSample: true`.
- `getRelatedStories(storyId)` returns story summaries with `relation` (`earlier`, `later`, `developing`) and confidence, ordered newest first. Confidence below 0.6 is excluded.
- `getMagnifiedNews(island, limit = 5)` returns summaries with an attributed `byline` and `coverageChip: { sources, regions }`. Qualifying stories have independent/regional/community/journalist reporting in the island within 72 hours. Rank = 3 × distinct eligible sources + distinct regions + freshness (0–1 over 72 hours); two Luzon slots are reserved for stories touching non-NCR regions when available. There are no payment or global engagement inputs; regional engagement is not collected yet.
- `createFlag({ kind, storyId?, targetId, note })` persists corrections (note ≤500 characters) and returns the created flag. `addNewsletterSignup(email)` validates, normalizes, and idempotently records an unconfirmed signup; it does not send mail. Neither write is wired to a new UI in this wave.
- `lib/queries/explore.ts`, `home.ts`, and `personal.ts` are async read helpers. Pure validation predicates (`isRegionId`, `isSourceTypeId`, `isTopic`) remain synchronous.
