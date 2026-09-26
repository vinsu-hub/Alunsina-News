// SQLite via Node's built-in `node:sqlite` (no native build step).
// JSON-array columns are stored as TEXT and parsed in lib/queries.ts.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

export const DB_PATH =
  process.env.ALUNSINA_DB ?? path.join(process.cwd(), "data", "alunsina.db");

const SCHEMA = /* sql */ `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  id               TEXT PRIMARY KEY,           -- slug
  name             TEXT NOT NULL,
  type             TEXT NOT NULL,              -- SourceTypeId
  ownership        TEXT NOT NULL,              -- factual, no editorializing (§22)
  ownership_source TEXT,                       -- where the ownership fact came from
  data_status      TEXT NOT NULL,              -- DataStatusId
  paywalled        INTEGER NOT NULL DEFAULT 0,
  homepage         TEXT NOT NULL,
  feed_url         TEXT,
  regions          TEXT NOT NULL DEFAULT '[]', -- RegionId[]
  languages        TEXT NOT NULL DEFAULT '[]', -- LanguageId[]
  topics           TEXT NOT NULL DEFAULT '[]',
  active           INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS stories (
  id          TEXT PRIMARY KEY,                -- slug
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'developing',
  topic       TEXT NOT NULL,
  score       REAL NOT NULL DEFAULT 0,         -- ranking for the edition
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id           TEXT PRIMARY KEY,               -- hash of canonical url
  source_id    TEXT NOT NULL REFERENCES sources(id),
  story_id     TEXT REFERENCES stories(id) ON DELETE SET NULL,
  headline     TEXT NOT NULL,
  byline       TEXT,
  url          TEXT NOT NULL UNIQUE,
  excerpt      TEXT NOT NULL DEFAULT '',        -- <= 2 sentences, enforced at ingest (§5A)
  published_at TEXT NOT NULL,
  language     TEXT NOT NULL DEFAULT 'en',
  region       TEXT,                           -- RegionId the reporting is about/from
  fetched_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS articles_story ON articles(story_id);
CREATE INDEX IF NOT EXISTS articles_source ON articles(source_id);
CREATE INDEX IF NOT EXISTS articles_published ON articles(published_at);

CREATE TABLE IF NOT EXISTS story_emphasis (
  story_id    TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  points      TEXT NOT NULL DEFAULT '[]',      -- string[]
  PRIMARY KEY (story_id, source_type)
);

CREATE TABLE IF NOT EXISTS story_angles (
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  angle    TEXT NOT NULL,
  share    REAL NOT NULL,                      -- 0..1 of articles
  note     TEXT,
  PRIMARY KEY (story_id, angle)
);

CREATE TABLE IF NOT EXISTS blindspots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id    TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                   -- BlindspotTypeId
  reason      TEXT NOT NULL,                   -- why it was detected (always shown)
  example     TEXT NOT NULL,                   -- one-line concrete example
  link_label  TEXT,
  link_href   TEXT,
  detected_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id    TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  at          TEXT NOT NULL,
  label       TEXT NOT NULL,
  source_type TEXT,
  article_id  TEXT
);

CREATE TABLE IF NOT EXISTS evidence (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id     TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,                  -- document | statement | dataset | study | report
  title        TEXT NOT NULL,
  publisher    TEXT NOT NULL,
  url          TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS fact_checks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id     TEXT REFERENCES stories(id) ON DELETE SET NULL,
  claim        TEXT NOT NULL,
  org          TEXT NOT NULL,
  rating       TEXT,                           -- as published by the fact-checker, verbatim
  url          TEXT NOT NULL UNIQUE,
  published_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingest_runs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  articles_seen INTEGER NOT NULL DEFAULT 0,
  articles_new  INTEGER NOT NULL DEFAULT 0,
  stories       INTEGER NOT NULL DEFAULT 0,
  errors        TEXT NOT NULL DEFAULT '[]'
);
`;

const g = globalThis as unknown as { __alunsinaDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!g.__alunsinaDb) {
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new DatabaseSync(DB_PATH);
    db.exec(SCHEMA);
    g.__alunsinaDb = db;
  }
  return g.__alunsinaDb;
}

export const json = <T>(s: unknown, fallback: T): T => {
  if (typeof s !== "string") return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};
