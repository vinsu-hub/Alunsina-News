# Wave 1c: Contributor layer + Explore/Sources/Search/Methodology updates (Codex)

Read docs/tasks/_common.md, docs/DECISIONS.md, Master spec §5, §8, §9, §10, §11, §12, §13 and Product Context v2 §8 (contributors).

**Owns:** `app/explore/**`, `app/topics/**`, `app/regions/**`, `app/languages/**`, `app/sources/**`, `app/search/**`, `app/blindspots/**`, `app/methodology/**`, `app/experts/**`, `app/contributors/**`, `app/contribute/**`, `components/explore/**`, `components/contributors/**`, `lib/queries/explore.ts`.

**Already available:** `CoverageChip`, `StoryImage`; async `listContributors`, `getContributor`, `getMagnifiedNews`, `listSources`; `EXPERT_FIELDS`; 9th source type; `RELATED_STORIES` threshold text in `lib/thresholds.ts`.

**Change:**
1. Explore sub-nav: Topics · Regions · Sources · Languages · **Experts & Commentary** · Blindspots · Saved.
2. **Experts & Commentary** section in Explore + `/experts` index browsable by field (EXPERT_FIELDS), clearly labeled as analysis, not reporting, and separate from Sources.
3. **`/contributors/[id]`** profile (same layout family as Source Profiles): real name, kind (Expert / Independent Journalist), credentials & affiliation (or portfolio for journalists), **declared conflicts of interest shown prominently**, contribution history (their commentary, linking to stories), "Verified for identity and expertise, not viewpoint" note → `/methodology#contributors`. Sample contributors display a "Sample profile" tag.
4. **`/contribute`** application page: explains the two contributor types, what's collected (real identity, expertise/portfolio, affiliation, declared conflicts), that review checks identity and expertise only, never political alignment, and RA 10173 (Data Privacy Act) handling "to be finalized". Render the form fields, but submission is **not processed yet**: the submit button is disabled with a clear notice "Applications open soon", and no data is sent or stored.
5. Sources: all 9 types everywhere (index filters, type descriptions), including Independent Journalist.
6. Regions: `/regions/[id]` for island ids gets an "Editor's picks: Magnified News" layer (top 5 from `getMagnifiedNews`), with the same selection-rule note ("Placement is never purchased…").
7. Search: results use CoverageChip + thumbnail (StoryImage small) + "Latest update: Xh ago".
8. Methodology: add #related-stories (how Related Stories are linked, rendered from `RELATED_STORIES.text`, distinct from clustering, both can be wrong), #contributors (verification process, conflicts disclosure, commentary never counts as a source, liability note that commentary is original hosted content), #magnified (selection rules), and update #corrections to mention the "This doesn't belong here" flag.
10. Topic/Region/Language listings: use CoverageChip + thumbnails consistently.

**Acceptance:** screenshots at 1440 and 390 for /explore, /experts, /contributors/<a sample id>, /contribute, /regions/visayas, /search?q=rice, /methodology; tsc + eslint clean on owned paths; all routes 200 (unknown contributor → 404).
