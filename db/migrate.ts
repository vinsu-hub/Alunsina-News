import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Db } from "./client";

export async function applyMigrations(db: Db): Promise<void> {
  await db.tx(async (t) => {
    // Serializes migration runners against Supabase and the local Postgres engine.
    await t.query("SELECT pg_advisory_xact_lock(72831001)");
    await t.exec(
      "CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const directory = path.join(process.cwd(), "db/migrations");
    for (const filename of (await readdir(directory))
      .filter((f) => f.endsWith(".sql"))
      .sort()) {
      if (
        await t.one(
          "SELECT filename FROM schema_migrations WHERE filename = $1",
          [filename],
        )
      )
        continue;
      await t.exec(await readFile(path.join(directory, filename), "utf8"));
      await t.execute("INSERT INTO schema_migrations(filename) VALUES ($1)", [
        filename,
      ]);
    }
  });
}
async function main() {
  const { getDb } = await import("./client");
  const db = await getDb();
  try {
    await applyMigrations(db);
    console.log("Migrations applied.");
  } finally {
    await db.close();
  }
}

if (process.argv[1]?.endsWith("migrate.ts"))
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
