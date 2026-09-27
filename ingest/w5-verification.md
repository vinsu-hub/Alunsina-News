# W5 ingest performance verification

Implemented source/article/fact-check multi-row inserts, per-cluster article reassignment,
shared touched-story member loads for fact-check linking/derive/blindspots, one-statement
collection replacement, batched related/trend writes, stage timings, and SQL-only
slow-query instrumentation (2 seconds, 120 characters, no bound parameters).
Migration 0007 and its identical Supabase copy add window/screening/fact-check indexes;
RLS is unchanged. No commit, deployment, production migration, or production non-dry ingest ran.

## Local verification

- `DATABASE_URL= npx tsc --noEmit`: passed.
- ESLint on all modified TypeScript paths: passed.
- `DATABASE_URL= NODE_OPTIONS=--conditions=react-server npx tsx --test ingest/*.test.ts`: 10 passed.
- `DATABASE_URL= NODE_OPTIONS=--conditions=react-server npx tsx ingest/perf-equivalence.ts`: passed.
- Fixed input: 72 articles from six source types, three resulting stories, fixed clock.
- Pre-change baseline: 1421.1 ms; initial optimized run: 982.8 ms (31% less).
- SHA-256 of canonical resulting tables in both runs:
  `7b3db55e0c627f2be96c265ca2380084787e6f960e0c5ef5b4302007f689a784`.
- Final regression additionally derives/blindspots a second time on populated collections;
  it passes the same hash (2236.2 ms, includes extra recomputation and concurrent host load).
  The committed checker pins the baseline hash and optionally accepts a saved baseline directory.
- The fixture has no qualifying trend terms or related links; existing tests separately
  exercise qualifying trends and related links. This is not a full network-ingest benchmark.

## Production acceptance: not met

The single authorized production command ran with react-server conditions:
`NODE_OPTIONS=--conditions=react-server npx tsx --env-file=.env.local ingest/run.ts --dry-run --no-llm`.
It failed on the first populated story-emphasis replacement with SQLSTATE 23505;
the transaction rolled back. No stage summary was returned and no slow-query messages
were emitted. The replacement CTE originally had no dependency forcing deletion before
insertion; the final code adds that dependency plus explicit types and passes a populated
collection regression locally. No second production invocation ran.

The <90-second production target and no-statements-over-10-seconds target remain
unverified. Reuse across related/trends is not implemented: their distinct public/time-window
semantics still use separate bounded queries. Further production validation needs explicit
additional authorization, and migration application belongs to the coordinator.
