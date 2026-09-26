# Task: My Area, Saved/Following, Settings (Codex)

Read docs/tasks/_common.md first.

**Owns:** `app/my-area/**`, `app/saved/**`, `app/settings/**`, `app/api/places/**`, `app/api/stories/**`, `components/personal/**`, `lib/queries/personal.ts`.

**State:** built by a previous agent that was mid-way through browser testing (it hit a selector ambiguity between Region VII and VIII in its own test). Treat as draft; finish and test.

**Change:**
1. `/my-area` (§18) as a local newspaper insert: empty state "Set your area to see local coverage" with an ARIA combobox (city/municipality via `/api/places?q=`, keyboard up/down/enter/escape) + "Use my current location" (geolocation → nearest place; graceful denial message; privacy note "We only store your city or municipality, on this device."). Set state: "MY AREA — {Place} · {Province}", "Change location →" reopening the picker inline, counts strip (Local · Regional · Government updates), sections Local / Regional / Government updates / Community reports / Local sources, honest per-section empty states, disabled "+ Add another area — coming soon".
2. `/saved` with tabs "Saved | Following"; `/settings` with #language (9 languages, "Prioritize coverage in these languages", say plainly UI isn't translated yet), Following chips (topics/regions/source types), #notifications honest "not available yet" (no dead toggles), My Area summary, "Clear all preferences on this device" with confirm.
3. No hydration mismatches: `usePref` returns ready=false on server — render neutral skeletons until ready. Works when localStorage is unavailable.
4. Browser-test the flows end to end with Playwright: set area via search (e.g. "San Pablo"), via mocked geolocation granted (lat 14.07, lng 121.33 → San Pablo) and denied, change area, save a story from `/story/metro-manila-lgus-prepare-flooding` via its Save button and see it on `/saved`, follow a topic and see the Following tab populate, clear prefs.

**Acceptance:** screenshots at 1440 and 390 for /my-area (empty + set), /saved (both tabs), /settings; the Playwright flow script saved at `scripts/e2e-personal.mjs` and passing; no console hydration errors; no horizontal scroll at 390; tsc + eslint clean on owned paths.
