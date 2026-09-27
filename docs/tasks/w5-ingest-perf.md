# W5: Make ingest fast on remote Postgres (Supabase) (Codex)

Read docs/tasks/_common.md. NEVER write to production: all tests run with `DATABASE_URL=` (PGlite) EXCEPT the one read-only-by-design dry run in Acceptance, which uses `--dry-run` (rolls back).

## Problem
Against Supabase (Tokyo pooler, ~60–100 ms round trip from the Mac), `ingest/run.ts --dry-run --no-llm` takes **333 s** at 1% CPU: it's dominated by per-row round trips. On Vercel (same region as the DB), one run failed with Postgres `canceling statement due to statement timeout` (~2 min) after 125 s: at least one statement is pathological on the real data volume (~1–2k articles, 30+ stories, growing).

## Change
1. Add per-stage timing to the run summary (fetch, insert, external, social, cluster, derive, blindspots, related, trends, rescreen, prune) and a per-statement slow-query log when a statement takes > 2 s (log the first 120 chars of SQL, never parameters).
2. Remove N+1 patterns: batch inserts (multi-row `INSERT … VALUES` / `unnest` arrays / `ON CONFLICT DO NOTHING`), load story members for all touched stories in one query, write emphasis/angles/timeline/evidence/blindspots per story with one statement each (or batched across stories), and reuse loaded data across derive → blindspots → related → trends instead of re-querying.
3. Find and fix any statement that scans unboundedly (e.g. trend/related computations over all articles, correlated subqueries, `ILIKE` over excerpts): bound by time window, add the needed indexes in a new migration `0007_ingest_perf.sql` (+ Supabase copy, RLS unchanged), or move the computation into TS over already-loaded rows.
4. Keep behavior identical (same stories, blindspots, trends, related links on the same input). Prove it with a PGlite before/after comparison on a fixed fixture (hash of the resulting tables).

## Acceptance
- tsc + eslint clean; existing ingest tests pass; the new equivalence check passes.
- PGlite run time reported before/after.
- `npx tsx --env-file=.env.local ingest/run.ts --dry-run --no-llm` (production, rolled back) completes in **< 90 s** from this Mac with no statement > 10 s; report the stage timings. Don't run a non-dry production ingest.
