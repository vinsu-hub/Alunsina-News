import type { Db, Params } from "../db/client";

/** Instrument the transaction client too; never log bound values. */
export function timedDb(db: Db): Db {
  async function time<T>(sql: string, run: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try { return await run(); }
    finally {
      const ms = performance.now() - start;
      if (ms > 2000) console.warn(`[ingest slow query] ${ms.toFixed(0)}ms ${sql.replace(/\s+/g, " ").slice(0, 120)}`);
    }
  }
  return {
    query: <T>(sql: string, params?: Params) => time(sql, () => db.query<T>(sql, params)),
    one: <T>(sql: string, params?: Params) => time(sql, () => db.one<T>(sql, params)),
    execute: (sql, params) => time(sql, () => db.execute(sql, params)),
    exec: (sql) => time(sql, () => db.exec(sql)),
    tx: (fn) => db.tx((tx) => fn(timedDb(tx))),
    close: () => db.close(),
  };
}

/** Chunk below Postgres's parameter limit. Prefix/suffix are static SQL only. */
export async function insertRows(db: Db, prefix: string, rows: unknown[][], suffix = ""): Promise<number> {
  let count = 0;
  for (let start = 0; start < rows.length; start += 500) {
    const chunk = rows.slice(start, start + 500);
    const params: unknown[] = [];
    const values = chunk.map((row) => `(${row.map((value) => { params.push(value); return `$${params.length}`; }).join(",")})`).join(",");
    count += (await db.execute(`${prefix} VALUES ${values} ${suffix}`, params)).changes;
  }
  return count;
}

/** Delete and replace a story's collection in a single round trip, including empty collections. */
export async function replaceRows(db: Db, table: string, columns: string[], storyId: string, rows: unknown[][]) {
  const params: unknown[] = [storyId];
  const types: Record<string, string> = { points: "jsonb", share: "real", at: "timestamptz", published_at: "timestamptz", detected_at: "timestamptz" };
  const values = rows.map((row) => `(${row.map((value, index) => { params.push(value); return `$${params.length}::${types[columns[index]] ?? "text"}`; }).join(",")})`).join(",");
  const insert = rows.length ? `INSERT INTO ${table} (${columns.join(",")}) SELECT v.* FROM (VALUES ${values}) AS v CROSS JOIN (SELECT count(*) FROM removed) AS barrier` : "SELECT 1";
  await db.query(`WITH removed AS (DELETE FROM ${table} WHERE story_id=$1 RETURNING *) ${insert}`, params);
}
