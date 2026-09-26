# Task: Story Detail + Compare Coverage mode (Codex)

Read docs/tasks/_common.md first.

**Owns:** `app/story/**`, `components/story/**`, `lib/queries/story.ts` (create if needed).

**State:** `/story/[id]` was built by a previous agent that stopped mid-polish (it had just noticed compare pane 1's text running into the pane divider). Sample ids: `metro-manila-lgus-prepare-flooding` (richest), `rice-prices-high-import-order`, `west-philippine-sea-resupply`, `inflation-september` (sparse).

**Change:**
1. Audit the page against SPEC §16, §20, §21, §22, §24 and finish anything missing: section order Header → What Happened → Timeline → Coverage (#coverage) → What Sources Emphasize (#emphasis) → Coverage Angles → Evidence (#evidence, incl. fact-checks attributed verbatim) → Source List (#sources, with ownership line + data status + ReadOnPublisher + filter chips) → Potential Blindspots (#blindspots, with "Why this was flagged" and methodology link).
2. In #coverage, mount the shared map: `import { PhilippineCoverage } from "@/components/coverage/PhilippineCoverage"` with the story's `coverage` and `compareTo` = platform-wide coverage (`getRegionCoverage({ sinceHours: 48 })` from `@/lib/queries`). Remove any placeholder slot.
3. Compare coverage mode (the key feature): toggle in header with aria-pressed, synced to `?compare=1` via router.replace (no scroll jump). Desktop: 2 panes default, "+ Add pane" to 3 (4 at ≥1440), per-pane source-type picker (only types present) + publisher picker, defaults pick maximally different types; pane shows publisher, type badge, ownership, time, serif headline, excerpt, language/region, "Read on … ↗", and a "What this type emphasizes" footnote. Fix the pane padding/divider overlap. Mobile (<768): horizontal scroll-snap carousel, one card per viewport, "2 of 5" indicator + prev/next buttons, no side-by-side. Fully keyboard operable.
4. Mobile order (§24): headline, summary, source count, coverage, perspectives, evidence, blindspots; timeline and full source list after, collapsible ("Show timeline", "Show all N articles").
5. Sparse stories (few sources, no evidence, no blindspots) must still look intentional with honest empty states.

**Acceptance:** screenshots at 1440 and 390 for the flooding story (normal + `?compare=1`) and `inflation-september`; deep link `?compare=1` opens compare mode; anchors #coverage #emphasis #evidence #sources #blindspots exist; no horizontal scroll at 390; tsc + eslint clean on owned paths; all 4 ids 200, unknown id 404.
