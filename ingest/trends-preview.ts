/** Production preview deliberately bypasses getDb (and automatic local migrations). */
import postgres from "postgres";
import { performance } from "node:perf_hooks";
import { candidateTerms, computeTrendingTerms, trendFilters } from "./trends";

async function main() {
  const connection = process.env.DATABASE_URL;
  if (!connection) throw new Error("trends:preview requires an explicit DATABASE_URL; no local database is opened");
  const url = new URL(connection);
  const sql = postgres(connection, { prepare: false, max: 1, ssl: ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname) ? false : "require" });
  try {
    await sql.begin("read only", async (tx) => {
      const [state] = await tx`SHOW transaction_read_only`;
      if (state.transaction_read_only !== "on") throw new Error("Read-only transaction was not established");
      const start = performance.now();
      const now = Date.now();
      const { terms, rows } = await computeTrendingTerms({ query: async <T>(query: string, params: readonly unknown[] = []) => {
        const result = await tx.unsafe(query, params as postgres.ParameterOrJSON<never>[]);
        return result.map((row) => ({ ...row, published_at: row.published_at instanceof Date ? row.published_at.toISOString() : row.published_at })) as T[];
      } }, now, 20);
      console.log(JSON.stringify({ readOnly: true, elapsedMs: Math.round(performance.now() - start), articles: rows.length, terms: terms.map((term) => ({ ...term, examples: rows.filter((row) => now - Date.parse(row.published_at) >= 0 && now - Date.parse(row.published_at) < 7 * 86400_000 && candidateTerms(row.headline).has(term.slug.replaceAll("-", " "))).slice(0, 3).map((row) => row.headline) })), filters: rows.flatMap((row) => trendFilters(row.headline).map((filter) => ({ headline: row.headline, ...filter }))) }, null, 2));
    });
  } finally { await sql.end(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Preview failed"); process.exitCode = 1; });
