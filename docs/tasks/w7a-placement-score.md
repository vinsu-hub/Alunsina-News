# W7a: Headline & Briefing Placement Score + 12-hour editions (Codex)

Read docs/tasks/_common.md, docs/DECISIONS.md, and **docs/reference/ALUNSINA_NEWS_Master_App_Spec.md** (revision 2026-09-28, §15). NEVER use production DATABASE_URL (use `DATABASE_URL=`), never run vercel, don't commit.

**Owns:** `ingest/placement.ts` (new), `ingest/pipeline.ts` (hook only), `ingest/*.test.ts` (new tests), `db/migrations/0008_editions.sql` + `supabase/migrations/20260928000008_editions.sql`, `lib/queries.ts` (`getEdition` only), `lib/queries/editions.ts` (new), `lib/thresholds.ts` (add `PLACEMENT`), `app/admin/editions/**` (new, read-only), `lib/queries/admin.ts` (additive read function only).

1. **Scoring** (`ingest/placement.ts`): for every active (non-hidden, updated in the last 72h, ≥2 non-social sources) story compute five normalized sub-scores in [0,1]:
   - `sources`: log-scaled distinct non-social sources, `log(1+n)/log(1+Nmax)`, counting distinct outlets (wire copies from one outlet count once);
   - `diversity`: distinct source types represented / 9;
   - `reach`: distinct regions / 18 (same region data as Coverage);
   - `recency`: `exp(-hoursSinceLastUpdate / 24)`;
   - `related`: 1 if the story has a Related Stories link (confidence ≥ 0.6) updated in the last 48h, else 0.
   Total = weighted sum with **equal weights (0.2 each)** from `PLACEMENT.weights` in `lib/thresholds.ts`. **No engagement inputs exist or may be added.** Add `PLACEMENT.text` (plain-language, for the Methodology page; the other worker renders it) that states the five signals and "Clicks, time-on-page, and other engagement or virality metrics are never used."
2. **Editions** (migration 0008; RLS on + anon/authenticated revoked, same as 0003): `editions(id, edition_at timestamptz unique, window_label text, created_at)`, `edition_placements(edition_id, story_id, slot text CHECK in ('lead','briefing','featured','top'), rank int, score real, subscores jsonb)`, `story_scores(story_id, scored_at, score, subscores jsonb)` (log of every scoring, pruned after 60 days).
   - An **editorial run** happens at most once per 12-hour window, at 06:00 and 18:00 Asia/Manila: the first ingest at/after each boundary creates the edition (idempotent; guarded by the unique `edition_at`), scoring all active stories, storing `story_scores`, and freezing placements: lead = rank 1, briefing = ranks 1–5, featured = ranks 2–4, top = ranks 5–16. Also run it when no edition exists yet (fresh DB).
   - DEVELOPING: set `stories.status = 'developing'` only for stories with `related = 1` or first reported < 12h ago (replace the current recency-only rule for the tag); others ongoing/settled as today.
3. **Serve**: `getEdition()` reads the latest edition's frozen placements (lead/briefing/featured/top in rank order) with live story data; if no edition exists, falls back to the current ranking. Keep the `Edition` return type compatible.
4. **Admin (read-only)** `/admin/editions`: latest editions, their placements with total + sub-scores, and "computed vs placed" so weights can be revisited later. Ask via Orca for the nav link to be added (the other worker owns `components/admin/Shell.tsx`).
5. **Tests**: engagement-free (assert the scorer's input type has no engagement fields); log scaling (5 wire copies from 1 outlet < 5 outlets once); diversity beats same-type volume; recency decay; edition idempotency across two ingests in the same window; 06:00/18:00 Manila boundaries.

Acceptance: tsc + eslint clean on owned paths; tests pass; `DATABASE_URL= ALUNSINA_PGLITE_DIR=data/pglite-w7a npm run ingest -- --no-llm` creates an edition and prints the lead + top 5 with sub-scores; `/` and `/admin/editions` 200 on the dev server.
