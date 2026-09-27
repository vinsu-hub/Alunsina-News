# W2d: Consolidate API route handlers (Vercel Hobby: max 12 functions per deployment) (Codex)

Read docs/tasks/_common.md. Deploy failed: "No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan." There are 12 `route.ts` files today; the last successful deploy had 7.

**Change (target: at most 7 route handlers total, behavior identical):**
1. Merge `app/api/admin/{ingest,logout,session}/route.ts`, `app/api/admin/pitches/[id]/publish/route.ts`, and `app/api/auth/admin/login/route.ts` into ONE catch-all `app/api/admin/[...action]/route.ts` dispatching on the path: `login` (POST, the only unauthenticated one: keep origin check + rate limit), `logout`, `session`, `ingest`, `pitches/<id>/publish`. Keep each action's method, status codes, response shapes, `maxDuration = 300`, and the in-handler admin session assertion for everything except login. Update `proxy.ts` so `/api/admin/login` is reachable without a session (and nothing else is). Update every caller (login form action, logout button, admin UI fetches, `scripts/e2e-admin.mjs`, docs) to the new URLs.
2. Merge `app/api/stories/route.ts` and `app/api/stories/area/route.ts` into one `app/api/stories/[[...slug]]/route.ts` with identical URLs (`/api/stories`, `/api/stories/area`).
3. Leave `api/area/[region]`, `api/flags`, `api/ingest` (cron), `api/newsletter`, `api/places` as they are.
4. If you can do it without changing public URLs, also consider folding `api/area/[region]` into the stories handler; not required.

**Acceptance:** `find app -name route.ts | wc -l` ≤ 7; tsc + eslint clean; `DATABASE_URL= node scripts/e2e-admin.mjs` (see its header for env) passes; curl checks: `/api/stories?ids=…`, `/api/stories/area?region=r4a…` 200; `/api/admin/session` 401 without cookie; login POST works and sets the cookie; `/api/ingest` still 401 without the bearer token. Never use the production DATABASE_URL; don't run vercel.
