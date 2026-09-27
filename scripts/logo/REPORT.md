# W3b logo implementation

Implemented transparent full logo and wordmark at 480/960 widths, square emblem at 512/1024, favicon at 16/32/48, 512 app icon, padded paper-backed 180 Apple icon, and 1200×630 OG image with serif tagline. Run `DATABASE_URL= python3 scripts/logo/prepare.py` with Pillow to regenerate; the source already has alpha, and the script also supports edge-connected near-white removal on opaque replacements without removing enclosed white shapes. The optional OG tagline uses Times New Roman on macOS and is omitted when that font is unavailable, as permitted by the task.

Desktop masthead uses a centered 132px lockup with both taglines; mobile uses a 36px emblem and 24px wordmark without taglines. Footer uses a 110px lockup; admin shell and existing login branding use the new Emblem, keeping its export and props. `/design` shows all three variants on paper and forest dark.

Validation: `DATABASE_URL= npx tsc --noEmit` and ESLint on all six owned TSX files pass. `/`, `/design`, and `/admin/login` return 200 at 1440×900 and 390×844; no page errors, and document scroll width equals viewport width. Brand images load; generated favicon and icon links appear in page head, and `/favicon.ico` returns 200. No new errors appear in the existing dev log. Screenshots are `.playwright-mcp/codex-w3b-home-{1440,390}.png`, `admin-login-{1440,390}.png`, `footer-{1440,390}.png`, `design-{1440,390}.png`, `logo-variants-{1440,390}.png`, and `codex-w3b-og.png` (all share the codex-w3b prefix).

## Palette observations and two options (not implemented)

The saturated logo blue contrasts strongly with the forest navigation and admin sidebar, and its bright red competes with terracotta status labels near the masthead. On forest-dark backgrounds the blue silhouette and blue wordmark lose contrast; the design gallery exposes this directly.

1. Keep the supplied national-color logo on paper surfaces, and place a paper inset behind it anywhere a dark surface is required; keep all existing UI colors unchanged.
2. Commission an approved single-color paper/ochre logo variant for forest-dark surfaces and an approved forest/terracotta/ochre editorial variant for paper mastheads; retain the original national-color logo for brand and share graphics.

No palette changes, production database access, deployment commands, or commits were performed. No implementation work remains; palette treatment is an owner decision.
