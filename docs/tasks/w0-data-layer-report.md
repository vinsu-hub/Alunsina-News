# Wave 0 data layer handoff

Implemented the async Postgres API, PGlite fallback, recorded SQL migrations and matching Supabase CLI copies, all existing query/ingest/seed callers, and v2.1 contributor/commentary/related-story/discovery/correction/newsletter contracts. Added the ninth source type and required palette, RSS publisher-image extraction, environment example, and updated async setup/API guidance in `docs/BUILD_BRIEF.md`. No commits or page design changes were made.

## Verification

- `npx tsc --noEmit`, `npx eslint .`, and `git diff --check`: clean. ESLint now excludes pre-existing `.claude/` worktrees and local database files.
- Fresh `ALUNSINA_PGLITE_DIR=data/pglite-fresh npm run migrate` and `npm run seed`: successful; 22 sources, 10 stories, 67 articles, four clearly fictional contributors, three sample commentary pieces, and four story links. Migration copies match byte-for-byte.
- `ALUNSINA_PGLITE_DIR=data/pglite-fresh NODE_OPTIONS=--conditions=react-server npx tsx scripts/smoke-queries.ts`: passed every exported query, 46 read checks plus writes/invariants, including related-story cutoff, newsletter idempotence, validation, and Luzon non-NCR reservation.
- Live `ALUNSINA_PGLITE_DIR=data/pglite-live npm run ingest -- --no-llm`: 20 feeds succeeded, zero feed errors, 402 fetched items, 392 new articles, 10 fact checks, and 23 new stories. **165 of 392 articles (42.1%) carry image URLs, across nine publishers**; 17 of 23 live stories have lead images. The live edition and article image/credit fields were also queried successfully.
- Dry-run ingestion against a separately seeded directory completed and rolled back edition writes; the sample query smoke checks still passed afterward.
- `POST /api/ingest` handler exercised directly with an isolated PGlite directory: 503 without configuration, 401 for a wrong bearer token, and 200 with a configured test token (392 articles and 23 stories). The LLM was disabled for this check.
- No database/runtime source contains the removed SQLite built-in import or `.prepare()` calls. The task document and ignored legacy worktrees still describe the previous implementation.
- HTTP 200: `/`, `/design`, `/story/metro-manila-lgus-prepare-flooding`, its `?compare=1` variant, `/explore`, `/topics/environment`, `/regions/luzon`, `/regions/r4a`, `/languages/fil`, `/sources`, `/sources/sample-calabarzon`, `/search?q=rice`, `/blindspots`, `/methodology`, `/my-area`, `/saved`, `/settings`, `/api/places?q=san`, `/api/area/r4a`. `/story/nope` returns 404. Extra topic/region/language index and personal API routes also return 200.
- Playwright checked home, story, Explore, and region pages at 1440×900 and 390×844: no page errors or horizontal overflow. Screenshots: `.playwright-mcp/codex-w0-{home,story,explore,region}-{1440,390}.png`. Dev log has no new application errors.

## Operational notes

The seeded dev server is running at `http://localhost:3100`, owning `data/pglite/`; reuse it. PGlite directories have a single owning process, so stop that server before seed/migrate/ingest/smoke against the same directory, or select a separate `ALUNSINA_PGLITE_DIR`. Production `DATABASE_URL` uses postgres.js with disabled prepared statements and required TLS except localhost; no Supabase credential was supplied, so the remote driver path was type-checked but not integration-tested.

Magnified ranking uses distinct independent/regional/community/journalist sources, recency, and distinct regions within 72 hours, with two qualifying non-NCR Luzon reservations and attributed bylines. Regional engagement is not collected yet, so it is not a ranking input. Commentary never contributes to source counts; sample images stay null. Classification remains heuristic; the optional existing synthesis pass now defaults to the decision-specified Sonnet model. New writes are data APIs only, ready for the next UI wave.
