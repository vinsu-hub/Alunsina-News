# Wave 1d ingestion verification — 2026-09-27

## Changes

- `related.ts` builds article TF-IDF centroids over a rolling 14-day window. Links require the same topic, a shared title entity, first-report timestamps at least six hours apart, and cosine similarity from 0.12 to below the coverage threshold (0.32). Confidence is `min(1, 0.4 + 0.3 × cosine / 0.32 + 0.1 × min(shared entities, 2))`; only confidence ≥ 0.6 is stored. Reciprocal relations describe the target: older story → `later`, newer story → `earlier`. Current-window links are recalculated each cycle to remove stale matches. This conservatively estimates separate events; it cannot prove that two events belong to one situation. The Methodology text explicitly says automated links can be wrong.
- A run-scoped official Anthropic SDK client budgets at most 40 Haiku calls for topic classification and borderline same-event decisions, and 15 Sonnet calls for summaries/emphasis. Checks apply within 0.05 raw cosine of the relevant assignment (0.32) or duplicate-cluster merge (0.45) threshold. API retries are disabled, requests timeout after 15 seconds, and input/output sizes are bounded. Missing credentials, `ALUNSINA_LLM=off`, `--no-llm`, and dry runs retain heuristics. Counts are logged and returned in the summary. Invalid responses, API failures and atomic synthesis-write failures retain heuristic output.
- Every API request uses the same system instructions/taxonomy and explicit ephemeral prompt-cache breakpoint. Actual cache hits depend on provider minimum-prefix requirements; no paid request or cache-hit measurement was performed. See [Anthropic prompt caching documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).
- Feed fetching identifies Alunsina honestly as an RSS reader; a 12-second request timeout plus one retry keeps the current feed set bounded. Extraction and feed checking share the same media-content, thumbnail, image-enclosure and first embedded-image parser, accepting only absolute HTTP(S) URLs. No article pages are scraped.
- Added Bombo Radyo and Brigada News after each returned 10 actual items. Both radio-network feeds carry `Ownership not yet verified` and no blanket region assignment. ABS-CBN and Abante are now unverified following repeated 403 responses with no discovered alternate; their candidate URLs remain available for future checks.

## Live ingest

Command: `ALUNSINA_PGLITE_DIR=data/pglite-live ALUNSINA_LLM=off npm run ingest -- --no-llm`.

Final run finished in **4.4 seconds**: **20 feeds successful, zero failed**, **273 fetched items**, **20 new articles**, **5 new stories**, **23 touched stories**, **165 news items with images**. The fetched items include 10 fact-checks, so news-item image share is **165/263 = 62.7%**. The separate live database holds **412 articles**, **165 with images (40.0%)**, and **28 stories**. Both LLM call counts were zero.

The first run before registry changes finished in 26.7 seconds with 17 successful feeds and three failures (ABS-CBN 403, Abante 403, Punto timeout). A later live dry run had a transient Philstar nation timeout; feed availability varies between checks.

**Live related rows ≥ 0.6: zero.** No current live story pair satisfied all gates. Three links were not fabricated to fill this sparse dataset; the three example pairs below are explicitly synthetic integration fixtures in a temporary database.

## Related example fixtures

Each pair generates two reciprocal rows, for six total rows ≥ 0.6. Each confidence is approximately **0.636** with the isolated six-story corpus.

1. “Port upgrade in Cebu opens berths for freight shipping cargo” → “Residents in Cebu protest road widening demolition resettlement port” (Transport).
2. “Flood warning in Davao prompts evacuation water river rainfall” → “Council in Davao funds river cleanup plastics waste drainage” (Environment).
3. “Rice harvest in Laguna raises crop yields irrigation farming” → “Traders in Laguna seek rice import tariff review prices” (Agriculture).

Tests verify directions, the confidence gate, removal after topic mismatch and rejection of first-report gaps under six hours.

## Feed/image check

`npm run check-feeds -- --images` checked all configured and previously blocked publishers, including discovery attempts. **18/31 sources** returned working feeds in the final check. Inquirer 40/40, GMA 15/15, Manila Times 50/50, BusinessWorld 30/30, Rappler 6/10, PCIJ 9/10, Bulatlat 5/10, PTV 10/10, Edge Davao 2/10, and Punto 7/10 had publisher images. Philstar 0/20; Manila Standard, Official Gazette, Panay News, Mindanao Times, Bombo Radyo and Brigada News each 0/10. The Rappler fact-check feed had images in 10/10 items, but is stored as fact-checks rather than news articles. Unavailable feeds have no image coverage denominator.

Extra probes: Bombo Radyo and Brigada returned 200 with 10 items each; Philippine Collegian failed to connect, Northern Dispatch returned 429, SunStar `/rss` returned 404 and `/feed/` returned zero items. These unsuccessful candidates were not newly marked verified.

## Checks and limitations

- `npx tsx --test ingest/ingestion.test.ts`: all three integration tests pass. They verify actual SDK request model names and cache markers, exact 40/15 budgets, zero calls with an explicit test credential while disabled, API and invalid-output fallback, feed image formats, reciprocal links, stale-link removal, and all-table dry-run rollback.
- A real-feed dry run in `data/pglite-live` finished in 24.6 seconds with 19 successful feeds and one transient timeout. Sorted contents of all 11 ingestion tables had identical SHA-256 before/after: `a2e56a6cb92fc9008bb5ca10de9ea1aafef7940b10b015d16261833fe7fe58e1`. No edition rows persisted; both API call counts were zero.
- `npx tsc --noEmit`, scoped ESLint and `git diff --check` pass. No production build was run during parallel work.
- Existing `POST /api/ingest` responded with expected 503 (`INGEST_TOKEN is not configured`) on the running dev server. Its route was not changed; a successful authenticated API call cannot be verified on that server without its missing token configuration.
- **Test isolation incident:** the first test revision set `ALUNSINA_PGLITE_DIR` after a transitive import had already fixed `db/client.DB_PATH`; fixture setup therefore inserted source `fixture` and stories/articles `0-0`, `0-1`, `1-0`, `1-1`, `2-0`, `2-1` into default `data/pglite`. Dry-run edition changes rolled back, but those fixture setup rows persisted. This was escalated immediately on detection. The coordinator acknowledged ownership of rebuilding the sample database after the homepage worker finishes; this worker did not reopen or attempt to repair the default database. The corrected test now directly constructs its PGlite engine at an explicit temporary path and never calls `getDb`.
