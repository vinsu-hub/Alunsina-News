# W4b verification — 2026-09-27

All commands used an explicitly empty `DATABASE_URL`; no Vercel command or production migration was run.

- `npx tsc --noEmit`: passed.
- ESLint on all changed TypeScript paths including the approved `db/seed.ts`: passed.
- `npx tsx --test ingest/trends.test.ts`: 3 passing tests covering excluded outlets/generic terms/weekdays, distinct-source and story minimums, case/possessive merging, previous-window counts and duplicate article deduplication.
- `ALUNSINA_PGLITE_DIR=data/pglite-w4b npm run ingest -- --no-llm`: completed twice; final run after registry fixes uses listing collectors for Manila Standard/CDN and removes GMA desk collectors. First run fetched 386 items, inserted 376 articles, and ranked Sara (8 sources / 2 stories), BSKE (5 / 2), and Marcos (3 / 2); no LLM calls.
- `ALUNSINA_PGLITE_DIR=data/pglite-w4b-sample npm run seed`: passed; sample terms Rice, Cebu and Flooding restored. These illustrative sample rows intentionally bypass live ranking thresholds and are identified by the global sample-edition banner.
- Isolated DB query confirmed `trending_terms.relrowsecurity = true`.
- `/`, `/trends`, `/trends/rice`: HTTP 200 on the shared sample DB after the coordinator restarted its server to apply migration 0006.
- Playwright verified those three routes at 1440×900 and 390×844, visible weekly ticker and term heading, zero page errors, and no horizontal document overflow. Screenshots: `.playwright-mcp/codex-w4b-{home,index,rice}-{1440,390}.png`.
- Registry probe evidence is recorded in `docs/INGEST_SOURCES.md`; Manila Standard and CDN return HTTP 403 with the honest project reader UA. GMA candidates discover only network RSS, and the regional homepage contains a mixed regional stream; no desk-specific listing was accepted.

The coordinator approved the seed-file change and handled the shared server restart. No other layout components or global CSS were changed by W4b. Supabase migration is supplied only, not applied remotely.
