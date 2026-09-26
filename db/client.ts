import { PGlite, type Transaction } from "@electric-sql/pglite";
import postgres from "postgres";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { applyMigrations } from "./migrate";

export type Params = readonly unknown[];
export type Row = Record<string, unknown>;
export interface Db {
  query<T = Row>(sql: string, params?: Params): Promise<T[]>;
  one<T = Row>(sql: string, params?: Params): Promise<T | undefined>;
  execute(sql: string, params?: Params): Promise<{ changes: number }>;
  exec(sql: string): Promise<void>;
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
export const DB_PATH = process.env.DATABASE_URL
  ? "DATABASE_URL (Postgres)"
  : path.resolve(process.env.ALUNSINA_PGLITE_DIR ?? "data/pglite");

// Dates use the same ISO-string contract for both drivers and all public mappers.
function normalize<T>(rows: unknown[]): T[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row as Row).map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : value,
      ]),
    ),
  ) as T[];
}
function embedded(
  engine: PGlite | Transaction,
  close: () => Promise<void>,
): Db {
  const db: Db = {
    async query<T>(sql: string, params: Params = []) {
      return normalize<T>((await engine.query(sql, [...params])).rows);
    },
    async one<T>(sql: string, params?: Params) {
      return (await db.query<T>(sql, params))[0];
    },
    async execute(sql: string, params: Params = []) {
      return {
        changes: (await engine.query(sql, [...params])).affectedRows ?? 0,
      };
    },
    async exec(sql: string) {
      await engine.exec(sql);
    },
    async tx<T>(fn: (t: Db) => Promise<T>) {
      if (!("transaction" in engine))
        throw new Error("Nested transactions are not supported");
      return engine.transaction((t) => fn(embedded(t, close)));
    },
    close,
  };
  return db;
}
function remote(engine: postgres.Sql, close: () => Promise<void>): Db {
  const db: Db = {
    async query<T>(sql: string, params: Params = []) {
      return normalize<T>(
        await engine.unsafe(sql, params as postgres.ParameterOrJSON<never>[]),
      );
    },
    async one<T>(sql: string, params?: Params) {
      return (await db.query<T>(sql, params))[0];
    },
    async execute(sql: string, params: Params = []) {
      const rows = await engine.unsafe(
        sql,
        params as postgres.ParameterOrJSON<never>[],
      );
      return { changes: rows.count };
    },
    async exec(sql: string) {
      await engine.unsafe(sql);
    },
    async tx<T>(fn: (t: Db) => Promise<T>) {
      return (await engine.begin((t) =>
        fn(remote(t as unknown as postgres.Sql, close)),
      )) as T;
    },
    close,
  };
  return db;
}
const globalDb = globalThis as unknown as { __alunsinaDb?: Promise<Db> };
export function getDb(): Promise<Db> {
  if (!globalDb.__alunsinaDb) {
    globalDb.__alunsinaDb = (async () => {
      if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        const sql = postgres(process.env.DATABASE_URL, {
          prepare: false,
          ssl: ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)
            ? false
            : "require",
        });
        return remote(sql, () => sql.end());
      }
      await mkdir(DB_PATH, { recursive: true });
      const engine = new PGlite(DB_PATH);
      await engine.waitReady;
      const db = embedded(engine, () => engine.close());
      await applyMigrations(db);
      return db;
    })().catch((error) => {
      delete globalDb.__alunsinaDb;
      throw error;
    });
  }
  return globalDb.__alunsinaDb;
}
export const json = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};
