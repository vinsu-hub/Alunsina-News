# W6: Trending keyword quality (Codex)

Read docs/tasks/_common.md. Use `DATABASE_URL=` (PGlite) only; don't touch production, don't run vercel, don't commit.

Live ticker after the first real run showed: `china, sara, sara-duterte, marcos, duterte, palace, pnp, sept, dpwh`. Problems:
1. **Month/date tokens** (`Sept`, `Sep`, `Oct`, `September`, weekdays, "Today", "Monday") must never be terms.
2. **Sub-term duplicates:** "Sara" and "Duterte" shown next to "Sara Duterte". When a shorter term's mentions are mostly (≥60%) inside a longer trending phrase, drop the shorter one; also merge first-name-only mentions into the full name when unambiguous.
3. **Generic institutional words on their own** ("Palace", "Senate", "House", "Court", "Government", "Police") are too vague as trends. Keep them only as part of a longer phrase ("Senate impeachment trial"), or keep a curated allowlist of meaningful acronyms/institutions (DPWH, PNP, DepEd, COMELEC, BSKE, NFA, DOH, PAGASA, MMDA) that stay allowed.
4. Prefer multi-word phrases (bigram/trigram named entities) over single words when they cover the same stories; cap the ticker at 10 terms with a variety rule (no more than 2 terms whose stories overlap > 70%).

Owns `ingest/trends.ts`, `ingest/trends.test.ts`. Extend the tests with these exact cases (the live list above must turn into something like `Sara Duterte, China, Marcos, DPWH, PNP, …` with no `sept`, `sara`, `palace`).

Acceptance: tsc + eslint clean on owned paths; tests pass; run `DATABASE_URL= ALUNSINA_PGLITE_DIR=data/pglite-w6 npm run ingest -- --no-llm` (with NODE_OPTIONS=--conditions=react-server if needed) and report the resulting top 10.
