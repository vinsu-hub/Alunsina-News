# Wave 1b: Story page v2.1 additions + My Area polish (Codex)

Read docs/tasks/_common.md, docs/DECISIONS.md, Master spec §3, §6, §7, §12 (`docs/reference/ALUNSINA_NEWS_Master_App_Spec.md`).

**Owns:** `app/story/**`, `components/story/**`, `app/api/flags/**`, `app/my-area/**`, `app/saved/**`, `app/settings/**`, `components/personal/**`, `app/api/places/**`, `app/api/stories/**`, `lib/queries/personal.ts`.

**Already available:** `CoverageChip`, `StoryImage` in `components/ui`; async `getStory`, `getStoryCommentary(storyId)`, `getRelatedStories(storyId)`, `createFlag(input)`; `Article.imageUrl/imageCredit`; 9th source type `journalist`.

**Change:**
1. Story header: lead photo (StoryImage with credit) when available; CoverageChip stat line; keep Compare toggle.
2. Section order per Master spec §7: Header → What Happened → Timeline → Coverage → What Sources Emphasize → Coverage Angles → Evidence → **Expert Commentary** → **Related Stories** → Source List → Potential Blindspots.
3. **Expert Commentary**: visually distinct cards (e.g. ochre left rule on paper-deep), permanent label "Analysis — Not Reporting", contributor name → `/contributors/<id>`, credentials, affiliation, **declared conflicts shown inline** (or "No conflicts declared"), title, body, date; multiple contributors when available; honest empty state ("No expert commentary on this story yet." + link to `/contribute`). Never counted in source counts.
4. **Related Stories** rail: timeline-ordered ("← 2 days ago: …", "→ Developing: …"), only confidence ≥ 0.6 (query already filters), CoverageChip per item.
5. **"This doesn't belong here" flag** on Coverage (per article in Source List + Compare panes) and on each Related Story: small text button opening an inline form (optional note ≤500 chars) → `POST /api/flags` (validate, rate-limit per IP in memory, 201 on success) → "Thanks, flagged for review. How corrections work →" linking `/methodology#corrections`.
6. Source List and Compare panes: show article thumbnail with credit when present; the 9 source types (journalist included) in filters and ordering.
7. My Area page: add hero image (lead image of the top local story, else placeholder) and the "Latest local stories" list format from Master spec §6 (story · time · category), CoverageChip on story rows.
8. Mobile order stays: headline → summary → source count → coverage → perspectives → evidence → blindspots; commentary and related after, collapsed.

**Acceptance:** screenshots at 1440 and 390 for `/story/metro-manila-lgus-prepare-flooding` (normal + compare), `/story/rice-prices-high-import-order`, `/my-area` (set); flag flow works end to end (row appears in `flags`), bad input → 400; tsc + eslint clean on owned paths; routes 200.
