# Build brief for parallel agents

Read `docs/SPEC.md` (product requirements) and `AGENTS.md` (this is Next.js 16 — check `node_modules/next/dist/docs/` before using an API you're unsure of; `params`/`searchParams` are Promises; `PageProps<'/route/[x]'>` is global).

## Worktree setup
```sh
ln -s "/Users/vincetamis/Desktop/VARIX/Alunsina News/node_modules" node_modules   # don't npm install
npm run seed         # creates data/alunsina.db with the sample edition
npx next typegen     # route types
npx next dev -p <your port>
```

## Shared foundation — use it, don't fork it
| Path | What |
|---|---|
| `lib/taxonomy.ts` | 8 source types + colors, 8 blindspot types, topics, regions/island groups, languages, data statuses |
| `lib/types.ts` | `StorySummary`, `StoryDetail`, `Source`, `Article`, `Blindspot`, `IslandCoverage`, `Edition`, `SourceProfile` |
| `lib/queries.ts` | `getEdition`, `getStory`, `listStories(filter)`, `listBlindspots`, `currentBlindspotsByType`, `listSources`, `getSource`, `search`, `getRegionCoverage`, `getTrendingTopics`, `getPlatformStats`, `getAreaFeed`, `getLastIngest` |
| `lib/thresholds.ts` | clustering + blindspot thresholds (ingestion implements, Methodology displays) |
| `lib/gazetteer.ts` | provinces/cities → region, `searchPlaces`, `nearestPlace`, `placeKey` |
| `lib/format.ts` | `timeAgo`, `editionDate`, `clockTime`, `pct`, `plural`, `briefingReadTime` |
| `lib/prefs.ts` | client `usePref(key, fallback)` + `PREF_KEYS` (saved, following, area, languages) |
| `components/ui` | `Rule`, `SectionHead`, `Kicker`, `StatusKicker`, `MetaLine`, `SourceTypeBadge`, `ReadOnPublisher`, `SubscriptionTag`, `CoverageBar`, `CoverageBreakdown`, `StoryCard`, `SaveButton`, `Icon` |
| `components/layout` | Masthead, MainNav, TrendingTicker, Footer, MobileTabBar, SampleBanner (already in `app/layout.tsx`) |
| `/design` | renders every primitive — look at it first |

CSS utilities in `app/globals.css`: `kicker`, `section-head`, `headline`, `meta`, `link-quiet`, `no-scrollbar`. Tailwind colors: `paper`, `paper-deep`, `ink`, `ink-soft`, `ink-muted`, `forest`, `forest-dark`, `terracotta`, `ochre`, `rule`. Fonts: `font-serif` (Newsreader), `font-sans` (Inter). Page container: `mx-auto max-w-[1280px] px-4 md:px-6`.

## Ownership rules (to keep merges clean)
- **Only edit files inside your owned paths.** Do not edit `lib/taxonomy.ts`, `lib/types.ts`, `lib/queries.ts`, `db/*`, `app/layout.tsx`, `app/globals.css`, `components/ui/*`, `components/layout/*`.
- Need a new query? Put it in `lib/queries/<your-area>.ts` (import `getDb`/`json` from `@/db/client`, add `import "server-only"`). Need a new UI primitive? Put it in your own components folder.
- If a shared file truly must change, don't change it — list the exact change in your final report and work around it.
- Server Components by default; `"use client"` only for interactive islands.

## Quality bar
- Editorial newspaper look: serif headlines, thin rules, multi-column, compact meta, square corners (≤2px radius), no drop shadows, no gradients, no political colors.
- Works at 390px (no horizontal page scroll; 16px gutter) and 1440px. Bottom tab bar is fixed on mobile — pages already get bottom padding from the footer.
- Always "Potential Blindspot" with a reason. Always "Read on [Publisher] ↗" for outbound; never render full article text.
- Accessible: semantic headings, labelled buttons, keyboard-operable toggles, `aria-expanded`/`aria-pressed` where relevant.
- Before finishing: `npx tsc --noEmit`, `npx eslint <your paths>`, and load your routes in the dev server (curl for 200 + no errors in the dev log). Commit your work on your branch with a clear message.

## Final report (keep it short)
Routes/files added, anything you couldn't finish, and any requested change to shared files (exact diff).
