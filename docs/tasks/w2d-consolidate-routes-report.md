# W2d route consolidation report

Implemented on 2026-09-27. API `route.ts` count is now **7**, down from 12.

- Admin actions share `app/api/admin/[...action]/route.ts`, retaining login origin/password/rate-limit checks, cookies, audit writes, protected in-handler session assertions, publication error responses, and `maxDuration = 300`.
- Login moved to `/api/admin/login`; the proxy exempts only that exact API path. Updated the login form, browser test, and build brief. Logout/session/ingest/publication callers keep their existing URLs.
- Stories share `app/api/stories/[[...slug]]/route.ts`, retaining `/api/stories` and `/api/stories/area` and their response shapes. The five other API handlers remain unchanged.
- Path dispatch preserves GET/POST restrictions, automatic HEAD behavior for session, and endpoint-specific OPTIONS Allow headers. Unknown paths return 404 after the admin auth boundary.

Verification passed:

- `DATABASE_URL= npx next typegen` and `DATABASE_URL= npx tsc --noEmit`.
- ESLint on both new handlers, proxy, login form, and browser test; `git diff --check`.
- `DATABASE_URL= PLAYWRIGHT_MODULE=/Users/vincetamis/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs node scripts/e2e-admin.mjs`: full admin workflow, JSON login/session/logout, cookie attributes, invalid origin, method restrictions, unknown paths, cron authorization, rate limit, 20 screenshots at 1440×900 and 390×844, no horizontal overflow or page errors. Screenshots retain the script's `.playwright-mcp/codex-w2b-*` names.
- Curl: stories with seeded ID 200; area r4a 200; session without cookie 401; cron POST without bearer token 401; removed login endpoint 404; unknown stories path 404; invalid area region 400.
- Dev log `/tmp/alunsina-w2d-dev.log` contains no runtime errors. Development server remains available on port 3100 with explicitly empty `DATABASE_URL`; local browser tests created sample contributors, held publications, correction resolutions, and audits.

No production database access, deployment, or git commit. Nothing remains for implementation; deployment verification belongs to the coordinator.
