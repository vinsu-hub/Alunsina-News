# W3a: Regional outlet expansion + external (Agent Reach) items + Reddit/X social signals (Codex)

Read docs/tasks/_common.md, docs/DECISIONS.md, Master spec §5A/§14 (`docs/reference/ALUNSINA_NEWS_Master_App_Spec.md`), and the ingest file headers (`ingest/*.ts`). NEVER use the production DATABASE_URL (run with `DATABASE_URL=`), never run vercel.

**Owns:** `config/feeds.ts`, `scripts/check-feeds.ts`, `ingest/**`, `lib/thresholds.ts` (additive), `docs/INGEST_SOURCES.md` (new), `.env.example`.

## 1. Outlets the owner wants covered
Add every outlet below to `config/feeds.ts` (reuse existing entries where already present; don't duplicate). For each: find the real public RSS/Atom feed(s) with `npm run check-feeds -- --probe <homepage>` (RSS discovery, /feed, /rss, section feeds). Honest User-Agent is preferred over browser impersonation. `verified: true` only when items actually come back. Correct `type` (national/regional/state), `regions` (region ids), `languages`, factual `ownership` (or "Ownership not yet verified"), `paywalled` where applicable.

- **Luzon (national & regional):** GMA News Online, INQUIRER.net, Philstar.com, ABS-CBN News, Manila Bulletin, TV5 / One News / One PH, Rappler, The Manila Times, Daily Tribune, GMA Regional TV Balitang Amianan (North/Central Luzon)
- **Visayas:** Cebu Daily News (CDN Digital), SunStar Cebu, The Freeman, GMA Regional TV Balitang Bisdak, Daily Guardian (Iloilo), The News Today (Iloilo), GMA Regional TV One Western Visayas, Panay News, Visayan Daily Star (Bacolod), The Bohol Chronicle
- **Mindanao:** MindaNews, Mindanao Times (Davao), GMA Regional TV One Mindanao, Mindanao Gold Star Daily (Cagayan de Oro), Davao Today, Business Week Mindanao, Kagay-an.com (Cagayan de Oro), Cagayan de Oro Times, Edge Davao, Mindanao Daily News

Outlets with **no working feed** (or blocked from this Mac) get `feeds: []`, `collector: "agent-reach"` (new optional field) and a `listingUrls: string[]` (their public latest-news/section page), so the server PC's Agent Reach collector can gather headline + link + time from those pages (see §2). Produce `docs/INGEST_SOURCES.md`: a table of all outlets with feed status, collector, region, and notes.

## 2. External items (server-PC Agent Reach collector → pipeline)
Add `ingest/external.ts`: if `EXTERNAL_ITEMS_DIR` is set, read every `*.jsonl` there (one JSON object per line):
```json
{"sourceId":"the-freeman","headline":"…","url":"https://…","publishedAt":"2026-09-27T08:00:00+08:00","excerpt":"optional, will be cut to 2 sentences","imageUrl":"optional http(s)","collectedAt":"…","collector":"agent-reach"}
```
Validate strictly (sourceId must exist in `config/feeds.ts` with `collector:"agent-reach"`; url must be http(s) on that outlet's domain; headline 10–300 chars; drop anything older than 7 days), normalize with the existing normalize/excerpt rules (≤2 sentences, never full text), then feed them into the same insert → cluster → derive path as RSS items. Move processed files to `EXTERNAL_ITEMS_DIR/processed/` (keep 7 days). Report counts in the run summary. Document the contract in `docs/INGEST_SOURCES.md`.

## 3. Social / Viral signals (official APIs only)
Source type `social` already exists. Social items are signals, never reporting: they never count toward a story's source count or regions, never become a story on their own, and only attach to an existing story (similarity ≥ the clustering threshold) to power the Social/Misinformation blindspot (already implemented) and the "Social / Viral" emphasis block.
- `ingest/social/reddit.ts`: **official Reddit OAuth API** (script app, client-credentials, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` like `alunsina-news/1.0 by <username>`). Top posts of the last 24h from r/Philippines, r/Cebu, r/davao, r/Iloilo, r/Bacolod, r/CagayanDeOro, r/baguio, r/manila (configurable list), plus search for the current top story topics. Store title, permalink, subreddit, score, created time only (no comment bodies, no usernames). Respect rate limits. Skipped silently when env is missing.
- `ingest/social/x.ts`: **official X API v2 only** (`X_BEARER_TOKEN`, recent search for current top story topics with `lang:en OR lang:tl`, place/country PH where available). Store text ≤280, post URL, created time, public metrics; no usernames in UI. Skipped when the token is missing. **Do not** use Agent Reach's cookie-based twitter-cli or any scraping (spec §14 / X ToS).
- UI already renders `social` items with the caution treatment; make sure the Social blindspot reason cites counts ("N Reddit posts, M X posts, no independent reporting yet").

## Acceptance
tsc + eslint clean on owned paths; `npm run check-feeds` output summarized in your report (per outlet: ok / collector / failed + reason); `DATABASE_URL= ALUNSINA_PGLITE_DIR=data/pglite-w3a npm run ingest -- --no-llm` completes with the new feeds; a fixture `EXTERNAL_ITEMS_DIR` test (valid + invalid lines) proves validation; Reddit/X modules unit-tested with mocked fetch (no real credentials needed); the social items never change `stats.sources`.
