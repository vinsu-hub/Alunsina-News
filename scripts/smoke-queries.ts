/** Run: NODE_OPTIONS=--conditions=react-server npx tsx scripts/smoke-queries.ts
 * PGlite is single-process: stop next dev first, or seed a separate ALUNSINA_PGLITE_DIR.
 */
import assert from "node:assert/strict";
import { getDb } from "../db/client";
import * as q from "../lib/queries";
import * as explore from "../lib/queries/explore";
import * as home from "../lib/queries/home";
import * as personal from "../lib/queries/personal";

async function main() {
  const db = await getDb();
  const storyId = "metro-manila-lgus-prepare-flooding";
  const sourceId = "sample-calabarzon";
  try {
    const story = await q.getStory(storyId);
    assert(story, "Run npm run seed before this smoke check");
    const reads = [
      () => q.coverageFromRegionCounts(new Map([["r4a", 2]])),
      () => q.getRegionCoverage(),
      () => q.getRegionCoverage({ storyId }),
      () => q.listStories(),
      () =>
        q.listStories({
          topic: "Environment",
          region: "r4a",
          island: "luzon",
          language: "en",
          sourceType: "regional",
          sourceId,
          sinceHours: 72,
          limit: 2,
          offset: 0,
        }),
      () => q.listBlindspots(),
      () => q.listBlindspots({ type: "geographic" }),
      () => q.currentBlindspotsByType(),
      () => q.listSources(),
      () => q.listSources({ type: "journalist" }),
      () => q.getSource(sourceId),
      () => q.search("rice"),
      () => q.getTrendingTopics(),
      () => q.getPlatformStats(),
      () => q.getLastIngest(),
      () => q.getEdition(),
      () => q.getAreaFeed("r4a"),
      () => q.listContributors(),
      () => q.listContributors({ kind: "expert", field: "Economics" }),
      () => q.getContributor("sample-prof-river"),
      () => q.getStoryCommentary(storyId),
      () => q.getRelatedStories(storyId),
      () => q.getMagnifiedNews("luzon"),
      () => q.getMagnifiedNews("visayas"),
      () => q.getMagnifiedNews("mindanao"),
      () => explore.getPlace("national"),
      () => explore.topicIndex(),
      () => explore.topicFromSlug("environment"),
      () => explore.trendingSubjects(),
      () => explore.placeStoryCounts(),
      () => explore.languageCounts(),
      () => explore.sourceTypeCounts(),
      () => explore.topicFacets("Environment"),
      async () => explore.placeCoverage((await explore.getPlace("luzon"))!),
      () => explore.regionComparison(["r4a"]),
      () => explore.sourcesInRegions(["r4a"]),
      () => explore.localReporting(["r4a"]),
      () => explore.evidenceForSource(sourceId),
      () => home.getAreaSummary("r4a"),
      () => home.isRegionId("r4a"),
      () => personal.getStorySummaries([storyId]),
      () => personal.getPersonalAreaFeed("r4a", "San Pablo", "Laguna"),
      () =>
        personal.getFollowingFeed({
          topics: ["Environment"],
          regions: ["r4a"],
          sourceTypes: ["community"],
        }),
      () => personal.isRegionId("r4a"),
      () => personal.isSourceTypeId("journalist"),
      () => personal.isTopic("Economy"),
    ];
    for (const read of reads) await read();
    assert.equal(await q.getStory("nope"), null);
    assert.equal((await q.listContributors()).length, 4);
    const commentary = await q.getStoryCommentary(storyId);
    assert(
      commentary.every(
        (c) =>
          c.isSample &&
          c.label === "Analysis — Not Reporting" &&
          c.body.length <= 1200,
      ),
    );
    assert(
      (await q.getRelatedStories(storyId)).every((s) => s.confidence >= 0.6),
    );
    assert.equal(story.leadImage, null);
    const magnified = await q.getMagnifiedNews("luzon");
    assert(magnified.every((s) => s.byline && s.coverageChip.sources > 0));
    const nonNcr = await db.query<{ story_id: string }>(
      "SELECT DISTINCT story_id FROM articles WHERE region <> 'ncr' AND story_id = ANY($1::text[])",
      [magnified.map((s) => s.id)],
    );
    assert(nonNcr.length >= 2, "Luzon reserves two qualifying non-NCR slots");
    const flag = await q.createFlag({
      kind: "coverage_mismatch",
      storyId,
      targetId: "smoke-test",
      note: "Sample smoke check",
    });
    try {
      assert.equal(flag.status, "open");
    } finally {
      await db.execute("DELETE FROM flags WHERE id = $1", [flag.id]);
    }
    const email = `smoke-${Date.now()}@example.org`;
    try {
      const first = await q.addNewsletterSignup(email.toUpperCase());
      const again = await q.addNewsletterSignup(email);
      assert.equal(first.createdAt, again.createdAt);
      assert.equal(again.confirmed, false);
    } finally {
      await db.execute("DELETE FROM newsletter_signups WHERE email = $1", [
        email,
      ]);
    }
    await assert.rejects(q.addNewsletterSignup("invalid"));
    await assert.rejects(
      q.createFlag({
        kind: "coverage_mismatch",
        targetId: "smoke",
        note: "x".repeat(501),
      }),
    );
    console.log(
      `All exported query functions passed (${reads.length} reads plus writes and invariants).`,
    );
  } finally {
    await db.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
