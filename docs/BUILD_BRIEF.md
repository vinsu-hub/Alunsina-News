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

## Pitch/admin backend contract (Wave 2a)

Configure `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `LAYA_URL`, and `LAYA_TOKEN` from `.env.example`. Do all local commands with **`DATABASE_URL=`**, including dev. Migrations 0004 add identity verification, contributor region/source/active state, pitches/publications, story moderation, flag resolution, and the audit log; their Supabase copy is identical. No approval columns or manual screening overrides exist.

`lib/admin/session.ts` implements SHA-256 digest password comparison and HMAC-SHA256 cookies (`alunsina_admin`, httpOnly, secure, sameSite=lax, 12 hours). `proxy.ts` protects `/admin/**` and `/api/admin/**`; `/admin/login` is public. Every exported admin query/mutation and every action/route re-checks the session. POST `/api/auth/admin/login` accepts a password via JSON or form data: 401 for wrong password, 429 after five attempts per IP in 15 minutes, 503 when the session secret is missing, JSON success or form redirect to `/admin`. The memory limiter trusts the deployment's `x-forwarded-for` header; the hosting edge must supply it. POST `/api/admin/logout` clears the cookie; GET `/api/admin/session` checks it. Configure credentials before starting dev to test login. Secure cookies work on localhost; deployed access must use HTTPS.

Public queries in `lib/queries/pitches.ts`:

- `listPublicPitches({ status?, region?, limit? })` → `PublicPitch[]` (limit default 30, max 100), ordered by activity. `getPitchesForContributor(id)` uses the same gates, max 100. Fields are camelCase: `pitchId`, `reporterId`, `topic`, `region`, `regionLabel`, `angle`, `timeframe`, `status`, `createdAt`, `updatedAt`, `statusChangedAt`, `contributor` summary (`id,name,credentials,bio,kind,isSample`), nullable `linkedBlindspot` (`id,type,storyId,storyTitle`), nullable `linkedStory` (`id,title,summary`). Verified + active contributors and passed pitch screening are required. Published cards also require a passed publication. Hidden linked stories/blindspots are omitted.
- `suggestBlindspotsForPitch(topic, region?)` → current detected blindspots with `id,type,storyId,storyTitle,reason,regionMatch,score`, ranked by region match plus token similarity. A suggestion does not reserve, assign, or require coverage.

Admin functions in `lib/queries/admin.ts` return database rows in **snake_case**, except `getDashboardStats()` (`counts,ingestRuns,pendingScreens,openFlags`) and `getAdminPitch(id)` (`pitch,publication`). Import the input types `ContributorInput` and `PitchInput`; updates take full inputs. Reads: `listAdminContributors`, `getAdminContributor`, `listAdminPitches(limit?)`, `getAdminPitch`, `listAdminCommentary`, `listAdminFlags(status?)`, `listAdminSources`, `listAdminStories(limit?)`, `listNewsletterSignups`, `listAdminAudit(limit?)`.

Mutations are exposed through matching async server actions in `app/admin/_actions/mutations.ts`:

- `createContributor(input)`, `updateContributor(id,input)`, `deleteContributor(id)`, `setContributorVerified(id,boolean)`. Verification creates a factual `journalist` source for a journalist if missing. Contributor kind cannot change while verified; a linked source must retain journalist type. Deletion removes the contributor's published pieces and cascades pitches/commentary.
- `createPitch(input)`, `updatePitch(id,input)`, `deletePitch(id)`, `publishPitch(id,{url,headline,excerpt})`, `rerunScreen(kind,id)` where kind is `pitch` or `publication`. Reporter must be verified and active. Creating a published status directly is rejected: publish creates the piece first. Existing pitches may move forward or back, including to published when a publication already exists; changes update `status_changed_at`. Reporter is immutable; resulting story links are set by clustering. Text edits re-hold and re-screen. Publishing requires a journalist source, validates HTTP(S) URL, headline, and an excerpt of at most two sentences. Each pitch has one publication; repeated publish is rejected, and screening retries use `rerunScreen`. POST `/api/admin/pitches/[id]/publish` is a JSON route for the same mutation.
- `saveCommentary(id|null,{storyId,contributorId,title,body})`, `deleteCommentary(id)` (body ≤1200 characters; the contributor must be verified/active); commentary remains Analysis — Not Reporting and never affects source counts.
- `resolveFlag(id,'resolved'|'dismissed',note)`, `updateSource(id,{type,ownership,ownershipSource?,dataStatus,paywalled,active})`, `updateStory(id,{title,summary,hidden})`, `deleteNewsletterSignup(email)`, `exportNewsletterCsv()`, `triggerIngest()`.

Successful mutations and newsletter exports are audited; ordinary mutations and their audit rows commit atomically. Ingest triggering is audited before running it. POST `/api/admin/ingest` and the admin page set the 300-second duration for ingest. CSV export returns a string with quoted cells and formula-prefix escaping. No mail is sent.

`lib/prescreen.ts` is server-only. `prescreen(text,kind)` posts `{text,presets:["guard_questions","moderation_questions"],kind}` to Laya with bearer auth and an 8-second timeout. `parseLayaResponse` is the sole adapter and has a TODO to confirm the provisional `{pass:boolean,categories:string[]}` contract. Errors, unknown shapes, timeout, or missing URL return pending with `screenedAt:null`. `rescreenPending(limit)` retries at most 50 pending items in batches of five; admin targeted re-runs can retry flagged content too, and compare text before saving to avoid stale results. It is called non-fatally at ingest completion. There is no local content keyword/topic screening.

All public story/article reads use `public_stories` / `public_articles` views so held publications and hidden stories cannot leak through search, coverage, source profiles, counts, or Magnified News. Held publications are also excluded from clustering; passed ones are included in the next normal ingest cycle with **no boost**. Clustering synchronizes `linked_story_id`. Single-source pieces remain loose articles until normal clustering requirements are met. Views are server-only in use; anon/authenticated privileges are revoked along with RLS on all new tables.

Verification on an isolated database (never use a directory owned by a dev server):

```sh
DATABASE_URL= ALUNSINA_PGLITE_DIR=data/pglite-w2a npm run migrate
DATABASE_URL= ALUNSINA_PGLITE_DIR=data/pglite-w2a npm run seed
DATABASE_URL= ALUNSINA_PGLITE_DIR=data/pglite-w2a NODE_OPTIONS=--conditions=react-server npx tsx scripts/smoke-pitches.ts
```

The smoke script requires an explicitly empty database URL, exercises real admin session assertions in a Next request-store fixture, and proves public identity/screening gates, held journalist publications, clustering linkage, hidden stories, audits, and screening fallback. It modifies sample screening states; re-seed afterward. `npm run ingest` sets the react-server condition because ingest now imports the server-only screening service.
