# Common rules for Codex workers (ALUNSINA NEWS)

Repo: /Users/vincetamis/Desktop/VARIX/Alunsina News (Next.js 16.3 App Router, React 19, Tailwind 4).
Read first: `docs/DECISIONS.md` (authoritative decisions + reference priority), then the reference docs it lists under `docs/reference/`, `docs/BUILD_BRIEF.md` (shared modules + conventions), and `AGENTS.md` (Next 16 breaking changes: `params`/`searchParams` are Promises; check `node_modules/next/dist/docs/` when unsure).

- Dev server: a server may be running at http://localhost:3100. If it's not responding, start ONE with `npx next dev -p 3100 > /private/tmp/claude-501/-Users-vincetamis-Desktop-VARIX-Alunsina-News/2b4dd8be-ce03-4c97-ac50-b75d601ff21c/scratchpad/dev.log 2>&1 &`. Never run `next build` while other workers are active, and never start a second dev server.
- Several workers edit this checkout in parallel. Edit ONLY the paths your task owns. Do NOT `git commit`, `git add`, `git stash`, `git checkout`, or `git reset`. The coordinator commits.
- If you need a change outside your owned paths, don't make it. Use the Orca `ask` command from your preamble to request it, or list it in your worker_done summary.
- Design bar: digital Philippine broadsheet + editorial intelligence (see the design brief and concept image). Serif headlines, Inter UI, thin rules, square-ish corners (≤2px), no heavy shadows or gradients, no political color coding, no bias meters.
- Trust rules: always "Potential Blindspot" + why; always "Read on [Publisher] ↗" outbound (never full article text); paywalled → "Subscription required"; photos always carry "Photo: [Publisher]" credit; ownership stated factually; never rate social claims true/false; Expert Commentary always labeled "Analysis — Not Reporting" and never counted as a source.
- Responsive: verify at 1440×900 and 390×844. No horizontal page scroll at 390 (`document.documentElement.scrollWidth <= innerWidth`).
- Accessibility: semantic headings in order, labelled controls, keyboard-operable toggles/tabs (roving tabindex or proper tablist), visible focus, alt text for images (use the headline; decorative placeholders get alt="").
- Browser verification: Playwright lives at `PLAYWRIGHT_MODULE=/Users/vincetamis/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs` (see `scripts/e2e-personal.mjs` for the import pattern). Save screenshots to `.playwright-mcp/codex-<task>-<page>-<width>.png`.
- Before worker_done: `npx tsc --noEmit` clean; `npx eslint <your paths>` clean; curl each of your routes → 200 with no new errors in the dev log. Pass `--files-modified`.
