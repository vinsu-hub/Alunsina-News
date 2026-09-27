# Wave 2c: Public "Reporting in Progress" board (Codex)

Read docs/tasks/_common.md, docs/DECISIONS.md, docs/reference/PITCH_BOARD_SPEC.md, and the pitch API in docs/BUILD_BRIEF.md (written by W2a). Use `listPublicPitches`, `getPitchesForContributor`; don't edit `lib/`, `db/`.

**Owns:** `app/explore/**`, `app/experts/**`, `app/contributors/**`, `app/methodology/**`, `components/explore/**`, `components/contributors/**`, `components/pitches/**` (new).

Change:
1. Explore → Experts & Commentary gets a sub-tab **"Reporting in Progress"** (also reachable at `/experts/reporting`, and as a tab on `/experts`). Cards exactly as the spec's example: `[Name] · Independent Journalist · [Region]` (name links to `/contributors/<id>`, credentials line), `Pitched: <topic> (<angle>)`, `Status: Pitched · Posted today` / `In Progress · Started 2 days ago` / `Published · <date>` with a link to the resulting Story when published, and a small **"linked to an open Blindspot"** tag (informational; links to that blindspot's story) when present. Filters: status, region. Honest empty state. A short explainer line: "Verified journalists post what they're reporting on. No topic needs approval; every post passes an automated safety screen (harassment, threats, doxxing), never a topic or viewpoint check."
2. Contributor profile (`/contributors/[id]`): a "Reporting in progress" section with that journalist's public pitches.
3. Methodology: new `#pitch-board` section: verification is a one-time identity/expertise gate, never per-story approval; the automated pre-screen checks only jailbreak/injection and harassment/threat/doxxing/targeted-defamation patterns, never topic, viewpoint, or whether an official is named; items are held until the screen runs; blindspot links are optional, system-suggested, informational; status is self-reported by the journalist; published pieces get no ranking boost. Link it from the board.
4. Mobile: cards stack; filters become a horizontal chip row.

**Acceptance:** screenshots at 1440 and 390 of `/experts/reporting`, `/experts`, a sample journalist profile, `/methodology#pitch-board`; the seeded pending/flagged pitches are NOT rendered (assert in a small Playwright or fetch check); tsc + eslint clean on owned paths; routes 200.
