/**
 * CLI entry: `npm run ingest [-- --dry-run] [-- --no-llm]`.
 * Uses DATABASE_URL or ALUNSINA_PGLITE_DIR (default data/pglite).
 */
import { DB_PATH, getDb } from "../db/client";
import { runIngest } from "./pipeline";

async function main() {
  const args = process.argv.slice(2);
  const db = await getDb();
  console.log(`Ingesting into ${DB_PATH}${args.includes("--dry-run") ? " (dry run)" : ""}…`);
  try {
  const s = await runIngest(db, { dryRun: args.includes("--dry-run"), llm: !args.includes("--no-llm") });
  if (s.skipped) {
    console.log("  skipped: another ingest is already writing (advisory lock held). Nothing changed.");
    return;
  }
  console.log(`
  feeds ok          ${s.feedsOk} (${s.feedErrors.length} failed)
  items fetched     ${s.articlesSeen}
  new articles      ${s.articlesNew}
  feed images       ${s.articlesWithImages}
  external items    ${s.external.accepted} accepted / ${s.external.rejected} rejected / ${s.external.inserted} inserted (${s.external.files} files)
  social signals    ${s.social.reddit} Reddit / ${s.social.x} X; ${s.social.attached} attached / ${s.social.unmatched} unmatched
  related links     ${s.related.links} (confidence >= 0.6)
  new fact-checks   ${s.factChecksNew}
  stories touched   ${s.storiesTouched} (${s.storiesCreated} new, ${s.storiesMerged} merged)
  blindspots        ${s.blindspots}
  llm summaries     ${s.llm.updated}${s.llm.errors.length ? ` (${s.llm.errors.length} errors)` : ""}
  sample removed    ${s.removedSample}
  duration          ${(s.durationMs / 1000).toFixed(1)}s`);
  console.log("  stages (ms)      ", JSON.stringify(s.stages));
  for (const e of s.feedErrors) console.log(`  ! ${e.source}: ${e.error} (${e.url})`);
  for (const e of s.llm.errors) console.log(`  ! llm ${e}`);
  for (const pair of s.related.examples) console.log(`  related (${pair.confidence.toFixed(2)}): ${pair.earlier} → ${pair.later}`);
  const top = (await db.query(`SELECT st.title, st.topic, st.status, COUNT(DISTINCT a.source_id)::int sources, COUNT(*)::int articles
       FROM stories st JOIN articles a ON a.story_id = st.id GROUP BY st.id ORDER BY st.score DESC LIMIT 12`, [])) as { title: string; topic: string; status: string; sources: number; articles: number }[];
  console.log("\n  Top stories:");
  for (const t of top) console.log(`  ${String(t.sources).padStart(3)} src ${String(t.articles).padStart(3)} art  [${t.topic}/${t.status}] ${t.title}`);
  } finally { await db.close(); }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
