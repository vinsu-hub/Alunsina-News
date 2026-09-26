# Task: Visual system + Homepage + global mobile shell (Codex)

Read docs/tasks/_common.md first.

**Owns:** `app/page.tsx`, `components/home/**`, `components/coverage/**`, `components/ui/**`, `components/layout/**`, `app/globals.css`, `app/design/**`, `app/layout.tsx`.

**Change:**
1. Homepage (§13–18) is built; make it excellent. Take 1440 and 390 screenshots first and critique it like a newspaper art director: hierarchy of the lead vs. rails, rhythm of rules and whitespace, the 3|6|3 top band balance (the Blindspot rail is capped at 5 with a <details> for the rest; check it balances with the lead at 1440), Daily Briefing numerals, "What Sources Are Emphasizing" (must read `On: "<lead title>"`), Philippine Coverage tile map legibility/interaction, My Area insert, ad slot (between Featured and lower sections, never in a rail), Top News density. Fix what's weak.
2. Fix lint warning: unused `listKey` in `components/coverage/PhilippineCoverage.tsx`.
3. Masthead/nav/ticker/footer/MobileTabBar polish at 390: masthead compact, nav horizontally scrollable with an edge fade hint, ticker readable, tab bar safe-area aware; ensure `main` has bottom padding on mobile so content never sits under the tab bar on ANY page (fix it globally in layout, not per page).
4. `/design`: make it a complete living style guide for every primitive in `components/ui` (including CoverageBreakdown, SaveButton, SubscriptionTag, StatusKicker variants).
5. Keep every exported component API in `components/ui` backward compatible (other workers use them concurrently). Additive props only.

**Constraints:** No new dependencies. Brand always "ALUNSINA NEWS" in full. Platform-wide article count only in the footer, never beside the briefing's "5 stories · ~5 min read".

**Acceptance:** before/after screenshots at 1440 and 390 for `/` and `/design` in `.playwright-mcp/`; no horizontal scroll at 390 on `/`, `/story/metro-manila-lgus-prepare-flooding`, `/explore`, `/my-area`; tsc + eslint clean on owned paths; `/` and `/design` 200.
