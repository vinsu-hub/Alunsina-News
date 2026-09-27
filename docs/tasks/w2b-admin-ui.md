# Wave 2b: Admin panel UI (Codex)

Read docs/tasks/_common.md, docs/DECISIONS.md, docs/reference/PITCH_BOARD_SPEC.md, and the admin/pitch API section of docs/BUILD_BRIEF.md (written by W2a). Use ONLY the existing admin queries + server actions (`lib/queries/admin.ts`, `app/admin/_actions/*`); if something is missing, ask via Orca rather than touching `lib/`, `db/`, `proxy.ts`.

**Owns:** `app/admin/**` (except `app/admin/_actions/**`, which you may extend with thin wrappers but not change semantics), `components/admin/**`.

The owner manages "everything" here. Functional, fast, calm. Same palette/typography as the site but denser: tables with thin rules, Inter throughout, serif only for page titles. Desktop-first but usable at 390px. Every mutation shows success/error feedback and confirms destructive actions. Server Components + server actions; client islands only for interactivity.

Pages:
1. `/admin/login`: restyled (masthead emblem, password field, error + rate-limit messages).
2. `/admin`: dashboard. Counts (stories, articles today, sources active, contributors verified, pitches by status, **pending screens**, open flags, newsletter signups), last 10 ingest runs with feed errors expandable, a "Run ingest now" button (shows the result summary; warn it can take minutes), a "Re-run pending screens" button, and a "Laya pre-screen: configured / not configured" status.
3. `/admin/contributors`: list + filters (kind, verified, active). Create/edit form (name, kind, field, credentials, affiliation, region, conflicts as a list editor, bio, portfolio URL). **Verify / Unverify** (explain: verification is a one-time identity & expertise check, never viewpoint). Link to the public profile.
4. `/admin/pitches`: list with filters (status, screening status, contributor, region). Create a pitch **on behalf of a verified contributor** (only verified+active contributors selectable): topic, region (taxonomy select, optional), angle, timeframe, optional blindspot link chosen from `suggestBlindspotsForPitch` suggestions (label it "optional, informational only"). Status controls pitched → in_progress → published as "recorded as reported by the journalist". Publish form: URL, headline, excerpt (≤2 sentences, live counter) → shows its screening result. Screening badge per pitch/publication (pending / passed / flagged + categories) with **"Re-run screen" only**; there is intentionally no approve/override button, and a short note explains why.
5. `/admin/flags`: corrections queue (open/resolved/dismissed tabs), each with kind, story link, target, note, age; Resolve / Dismiss with a resolution note.
6. `/admin/stories`: search + list; hide/unhide; edit title/summary; link to public page.
7. `/admin/sources`: table of sources; edit type (9 types), ownership, ownership source, data status, paywalled, active.
8. `/admin/commentary`: list/create/edit/unpublish expert commentary attached to stories (contributor select limited to verified experts; body ≤1200 chars counter).
9. `/admin/newsletter`: list, delete, CSV export.
10. `/admin/audit`: audit log (newest first, filters by entity).
Shared admin layout: left nav (collapsible on mobile), header with "Signed in as admin" + Log out, `noindex` metadata. The public site layout (masthead/footer/tab bar) must NOT render on admin pages; use a route group or a layout that opts out cleanly without editing `app/layout.tsx`. If that's impossible, ask via Orca.

**Acceptance:** Playwright script `scripts/e2e-admin.mjs` (run with `DATABASE_URL=` and the PLAYWRIGHT_MODULE from _common): login fails with a wrong password, succeeds with `ADMIN_PASSWORD` from the env; create contributor → verify → create pitch → move to in_progress → publish (screen stays pending without LAYA_URL, so the pitch is NOT visible on the public board) → resolve a flag → hide/unhide a story → export CSV; logout blocks /admin again. Screenshots at 1440 and 390 of each admin page (`.playwright-mcp/codex-w2b-*.png`). tsc + eslint clean on owned paths.
