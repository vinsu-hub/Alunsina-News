# W6b: Tune trending keywords on real production data (read-only) (Codex)

Read docs/tasks/_common.md and docs/tasks/w6-trend-quality.md (previous round). **Exception to the production rule for this task only:** you may READ production through `.env.local`'s DATABASE_URL using a new read-only preview command. You must NOT write to production: no ingest, no migrate, no seed, and no `refreshTrendingTerms` against production.

After W6 was deployed and a real ingest ran, production `trending_terms` still reads: `Sara, Duterte, City, China, Marcos, Health, Nino, PNP, DPWH`. Your local fixture produced better results, so the rules don't generalize to real headlines (e.g. "VP Sara", "Sara Duterte's", "Davao City", "El Niño", "DOH health advisory").

1. Add `ingest/trends-preview.ts` (`npm run trends:preview`): opens the DB **inside a `BEGIN READ ONLY` transaction** (or `SET default_transaction_read_only = on` for the session), runs the same candidate extraction + scoring as `refreshTrendingTerms` but returns/prints the top 20 with their evidence (sources, stories, 3 example headlines per term, which filters fired). Refactor `ingest/trends.ts` so compute and write are separate functions and the preview reuses compute.
2. Run the preview against production (`npx tsx --env-file=.env.local ingest/trends-preview.ts`, with `NODE_OPTIONS=--conditions=react-server` if needed) and iterate on the rules until the top 10 are meaningful news keywords. Expected to handle at least:
   - honorific/role prefixes and possessives: "VP Sara", "Sara Duterte's", "Vice President Sara Duterte" → **Sara Duterte**; "Ex-President Duterte" / "FPRRD" → **Rodrigo Duterte** only when unambiguous, else drop bare "Duterte";
   - place suffix words alone ("City", "Province", "Island") are never terms; "Davao City" / "Cebu City" allowed as phrases;
   - keep diacritics and articles in display names: **El Niño**, not "Nino" (slug `el-nino`);
   - generic topical words ("Health", "Weather", "Economy", "Prices") alone are not trends (categories already cover them); allow meaningful acronyms (DOH, DPWH, PNP, BSKE, NFA, PAGASA, COMELEC, MMDA, DepEd).
3. Add each real-data failure as a unit test (fixture headlines copied from the preview output).
4. Keep everything deterministic and fast (< 2 s on production data).

Owns `ingest/trends.ts`, `ingest/trends.test.ts`, `ingest/trends-preview.ts`, and the `trends:preview` line in `package.json`.

Acceptance: tsc + eslint clean; tests pass; paste the final production preview top 10 (with sources/stories) in your summary; confirm no write statements executed (the read-only transaction would have errored).
