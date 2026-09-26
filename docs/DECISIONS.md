# Product decisions (2026-09-27)

Authoritative references, in priority order:
1. `docs/reference/ALUNSINA_NEWS_Master_App_Spec.md`: what to build, per screen.
2. `docs/reference/alunsina_news_homepage_design_brief.md` + `docs/reference/homepage-concept.png`: homepage visual concept.
3. `docs/reference/ALUNSINA_NEWS_Product_Context_v2.md`: rationale (v2.1).
4. `docs/SPEC.md`: older condensed spec; superseded where it conflicts.

Decisions made with the product owner:
- **Images:** use the image each publisher includes in its own RSS item (media:content / media:thumbnail / enclosure / first <img> in content), hotlinked, always with a visible "Photo: [Publisher]" credit, never re-hosted. Fallback: a typographic/topic placeholder (no stock photos). Sample-edition publishers are fictional → placeholders.
- **Nav action buttons:** the brief's "Order Now | Reserve | Catering" was restaurant-template leftover. Use the same outlined-button style for **Subscribe to briefing** (primary, filled) and **Methodology** (outlined).
- **Hosting:** Supabase Postgres + Vercel. Local dev uses PGlite (embedded Postgres) when `DATABASE_URL` is unset; production uses `DATABASE_URL`. Cron (Modal, `cron/ingest_cron.py`) calls `POST /api/ingest`.
- **Contributors (v2.1):** reader-facing UI only this round: 9th source type "Independent Journalist", Expert Commentary cards on Story pages ("Analysis — Not Reporting"), contributor profiles, Experts & Commentary in Explore, an application form that is displayed but explicitly not processed yet. All contributor content in dev is clearly-labeled sample data. No admin/review queue (spec Open Item).
- **Source-type colors:** muted information signals per the brief (Government dark green, National blue, Regional terracotta, Independent purple, Community muted teal; others neutral). Never political meaning.
- **LLM model split (spec §15):** Claude Haiku (`claude-haiku-4-5`) for classification/tagging, Claude Sonnet (`claude-sonnet-5`) for synthesis/writing. Off unless an Anthropic credential is configured.
