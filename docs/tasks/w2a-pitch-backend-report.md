# Wave 2a backend handoff

Implemented the migration/Supabase copy, identity verification and journalist source linkage, pitch/publication queries and admin CRUD, audit records, Laya adapter/retries, public visibility filtering, ingest integration, authenticated actions/routes, sample pitches, environment variables, and API documentation. No production database was used and no commit was made.

## Verification

- `DATABASE_URL= ALUNSINA_PGLITE_DIR=data/pglite-w2a npm run migrate`: passed on a fresh isolated PGlite database.
- Seed: passed; the two public example pitches plus held pending/flagged fixtures are present. The smoke database was re-seeded after verification.
- `NODE_OPTIONS=--conditions=react-server npx tsx scripts/smoke-pitches.ts`: passed with explicitly empty DATABASE_URL and isolated w2a directory. Proves public screening/verification/active gates, missing-Laya fallback, cookie integrity/password/limiter behavior, unauthorized admin functions, contributor verification/source reuse, held journalist publication invisibility in stories/search/clustering, passed publication flow, story linkage, hidden stories, re-screen, and audit rows.
- Existing `scripts/smoke-queries.ts`: all 46 reads plus writes/invariants passed. Its seeded contributor-count expectation changed from four to six.
- `npx tsc --noEmit`, ESLint on all changed TypeScript paths, and `git diff --check`: passed.
- Canonical/Supabase migration copies compare byte-for-byte; migration uses PostgreSQL SQL with RLS and role-conditional revokes, verified through PGlite.
- HTTP: `/admin` redirects without cookie; `/admin/login` returns 200; admin endpoints return 401 without cookie; five wrong attempts return 401 then 429; correct login returns the signed secure cookie; authenticated `/admin` and session return 200; logout returns 200. Publish route returns 200 with pending publication when Laya is unavailable.
- Public `/`, `/api/stories`, `/explore`, and the new journalist profile return 200.
- Real browser form login passes at 1440×900 and 390×844 with no horizontal overflow. Screenshots: `.playwright-mcp/codex-w2a-{login,admin}-{1440,390}.png`. Final capture used `caret:initial` to avoid Playwright's injected caret styles causing a shared-header hydration warning; final capture had no page errors.

## Next workers

See `docs/BUILD_BRIEF.md` for function names, input types, return shapes, routes, and screening rules. Public pitch outputs are camelCase; admin rows are snake_case. Server actions expose mutations with the same names as `lib/queries/admin.ts`. Admin page and login are intentionally minimal functional foundations for the UI worker.

The existing dev process was restarted so it could load migration 0004. A single server is running on port 3100 with `DATABASE_URL=` and `ALUNSINA_PGLITE_DIR=data/pglite-w2a-http`; local-only test login is `w2a-local-test`, with an ephemeral test session secret supplied to that process. This directory is owned by the server and must not be opened by seed/migrate/scripts while it runs. Its pending sample pitch was published during HTTP verification and remains held; the separate `data/pglite-w2a` directory contains the clean seeded edition.

Laya is unavailable here and its response contract remains provisional, as requested: the adapter TODO expects `{pass:boolean,categories:string[]}` and fails closed. Live Laya verification remains for the server-PC integration. Passed publications enter the next ordinary ingest cycle; single-source items stay loose under the existing clustering threshold, with no ranking boost. A pitch has one publication; retry screening through `rerunScreen`, and do not repeat `publishPitch` to retry. Ingest CLI now supplies the react-server condition for the server-only screen import.
