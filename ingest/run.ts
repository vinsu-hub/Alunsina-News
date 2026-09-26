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
  console.log(`
  feeds ok          ${s.feedsOk} (${s.feedErrors.length} failed)
  items fetched     ${s.articlesSeen}
  new articles      ${s.articlesNew}
  new fact-checks   ${s.factChecksNew}
  stories touched   ${s.storiesTouched} (${s.storiesCreated} new, ${s.storiesMerged} merged)
  blindspots        ${s.blindspots}
  llm summaries     ${s.llm.updated}${s.llm.errors.length ? ` (${s.llm.errors.length} errors)` : ""}
  sample removed    ${s.removedSample}
  duration          ${(s.durationMs / 1000).toFixed(1)}s`);
  for (const e of s.feedErrors) console.log(`  ! ${e.source}: ${e.error} (${e.url})`);
  for (const e of s.llm.errors) console.log(`  ! llm ${e}`);
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
