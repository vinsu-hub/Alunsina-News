# W3b: New logo + placement (Codex)

Read docs/tasks/_common.md. Source logo: `docs/reference/logo-source.png` (1254×1254, emblem: gold star + circle arc, blue woman-profile silhouette with gold/red Philippine-flag waves; wordmark "ALUNSINA" blue + "NEWS" red; gold rule with a small star). It sits on a WHITE background, while the site background is paper `#F4F1E8`.

**Owns:** `public/**`, `app/icon*`, `app/apple-icon*`, `app/opengraph-image*`, `app/favicon.ico`, `components/layout/Masthead.tsx`, `components/layout/Footer.tsx`, `components/ui/Emblem.tsx`, `components/admin/Shell.tsx`, `app/admin/login/page.tsx`, `app/design/**`, `scripts/logo/**`.

**Change:**
1. Asset prep (script in `scripts/logo/` using Python Pillow, reproducible): make the white background transparent (flood-fill from the edges with a tolerance so anti-aliased edges stay clean; don't punch holes in white shapes inside the emblem); trim; export:
   - `public/brand/alunsina-logo-full.png` (emblem + wordmark + rule, transparent, @1x/@2x widths ~480/960),
   - `public/brand/alunsina-emblem.png` (emblem only, cropped above the wordmark, square, 512/1024),
   - `public/brand/alunsina-wordmark.png` (wordmark + rule only),
   - favicon/app icons from the emblem: `app/icon.png` (512), `app/apple-icon.png` (180, emblem on paper background with padding), `app/favicon.ico` (16/32/48);
   - `app/opengraph-image.png` 1200×630: paper background, full logo centered, tagline "Truth has more than one source." in Newsreader-like serif (render text in Pillow with a bundled font or skip the tagline if no font is available).
   Use `next/image` for these local assets with correct width/height and `priority` in the masthead.
2. **Masthead:** replace the current SVG spark + text wordmark with the new logo. Desktop: full lockup (emblem above wordmark), height ~120–140px, centered, keeping the left date block and right search/icons balanced; keep the taglines under it ("Truth has more than one source." / italic "More context. A clearer picture."). If the lockup's own gold rule + star makes the taglines crowded, keep the rule and put the taglines beneath. Mobile (<768): compact horizontal version (small emblem ~36px + wordmark image ~24px tall), no taglines, keeping the masthead short. The text "ALUNSINA NEWS" must remain as accessible text (`alt="ALUNSINA NEWS"` on the logo or visually-hidden h1-equivalent) for SEO/screen readers.
3. **Footer:** full logo (smaller) replacing the text wordmark; keep taglines, social icons, columns.
4. **Admin shell + admin login:** emblem + "ALUNSINA NEWS Edition Desk".
5. `components/ui/Emblem.tsx`: render the new emblem image (keep the same export/props so existing call sites still work).
6. `/design`: show the logo variants on paper and on forest-dark backgrounds.
7. Don't change the site color palette in this task. In your report, note where the logo's blue/red clashes with the forest/terracotta palette and give 2 concrete options (don't implement them).

**Acceptance:** screenshots at 1440 and 390 of `/`, `/admin/login`, and the footer, plus the generated OG image (`.playwright-mcp/codex-w3b-*.png`); no white box around the logo on the paper background; favicon shows in the tab; tsc + eslint clean on owned paths; `/` and `/design` 200.
