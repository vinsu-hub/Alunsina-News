# Wave 2b admin UI handoff

Implemented all ten admin pages with a responsive edition-desk layout, mobile navigation, noindex metadata, sign-in/rate-limit feedback, logout, and public-chrome exclusion. Server-rendered pages use the existing admin reads and mutation actions; small client islands handle forms, confirmation, live counters, conflicts, downloads, and persistent success/error feedback.

## Delivered

- Dashboard: exact story/article-today/pitch-status counts, active sources, verified contributors, pending screens, open flags, newsletter signups, last ten ingest runs with expandable errors, authenticated/audited bulk screening retry, ingest confirmation/result summary, and Laya configuration status.
- Contributors: kind/verification/activity filters, create/edit all requested fields, conflict list editor, verify/unverify with the identity/expertise distinction, public profile links.
- Pitches: four filters, verified/active contributor selection, taxonomy regions, optional informational blindspot suggestions, editable self-reported status, publication form with live two-sentence counter, pitch/publication screening badges and reruns. There is no approve/override control.
- Flags: open/resolved/dismissed views, story links, target/note/age, resolution note and confirmation.
- Stories: search over the latest 200, title/summary editing, hide/unhide and public links.
- Sources: table with all nine types and requested metadata fields.
- Commentary: verified active expert selection, story attachment, create/edit/unpublish, 1200-character live counter, analysis label.
- Newsletter: list, confirmed status, delete confirmation, audited CSV download.
- Audit: newest-first records with entity filter and expandable details.

## Approved shared-path additions

Coordinator approved the `app/layout.tsx` slot wrapper (`components/admin/PublicChrome.tsx`) because a child layout cannot remove root public chrome. Public header/footer components remain server-rendered slots; public styling and structure remain the same. Coordinator also approved adding Manila-day article counts and exact pitch-status totals to `getDashboardStats`, and the authenticated/audited `rescreenPending` action; other backend semantics are unchanged.

## Verification

- `DATABASE_URL= npx tsc --noEmit`: passed.
- `DATABASE_URL= npx eslint app/admin components/admin app/layout.tsx lib/queries/admin.ts scripts/e2e-admin.mjs`: passed.
- `git diff --check`: passed.
- `DATABASE_URL= PLAYWRIGHT_MODULE=/Users/vincetamis/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs node scripts/e2e-admin.mjs`: passed.
- Browser acceptance: incorrect password, correct password from `.env.local`, create contributor, verify, create pitch, record in-progress, record publication, both screens pending without Laya, absence on `/experts/reporting` and the contributor profile, submit a real sample correction through the public UI and resolve it in admin, hide/unhide, CSV download, logout protection, and real 429 rate-limit feedback.
- Twenty page screenshots at 1440×900 and 390×844: `.playwright-mcp/codex-w2b-{overview,login,contributors,pitches,flags,stories,sources,commentary,newsletter,audit}-{1440,390}.png`.
- Four additional expanded-form screenshots at 390px: `.playwright-mcp/codex-w2b-{contributors,pitches,commentary,sources}-expanded-390.png`.
- No horizontal page overflow on any page or expanded form; no browser page errors in final acceptance.
- Authenticated curl returned 200 for all ten routes. Final requests introduced no server errors. An earlier aborted test caused one “destination stream closed early” log entry; subsequent complete runs were clean.

## Local runtime / limits

The single dev server remains on port 3100, using `DATABASE_URL=` and `ALUNSINA_PGLITE_DIR=data/pglite-w2a-http`, with `.env.local` admin credentials (never printed). Log: `/private/tmp/alunsina-w2b-dev.log`. PGlite was accessed only through the running application. Browser fixtures remain in this isolated local database and are explicitly named Sample E2E; nothing touched production and nothing was committed.

Existing backend reads cap stories, pitches, and audit at 200; the UI labels those limits, while dashboard counts are exact. Laya remains unavailable, so live passed-screen integration remains the server-PC task. Ingest is wired with confirmation and result feedback but was not triggered in this UI run because it would fetch external feeds and change the shared sample edition.
