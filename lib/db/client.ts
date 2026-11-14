import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA_SQL, SCHEMA_VERSION, FTS_SQL } from "./schema";

/**
 * Single entry point for the SQLite connection.
 *
 * Hana uses Node's built-in `node:sqlite` (stable since Node 22.5) instead of a
 * native module, so `npm install` never needs a C++ toolchain and the Docker
 * image stays dependency-free. Swapping in another driver only requires
 * touching this file.
 */

export type SqlValue = string | number | null | Uint8Array;

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

export const DB_FILE = path.join(DATA_DIR, "hana.db");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

type GlobalWithDb = typeof globalThis & { __hanaDb?: DatabaseSync };

const globalRef = globalThis as GlobalWithDb;

export function hasFts(): boolean {
  getDb();
  return globalRef.__hanaFts !== false;
}

declare global {
  var __hanaFts: boolean | undefined;
}

/** Opens (and on first call creates) the database. */
export function getDb(): DatabaseSync {
  if (globalRef.__hanaDb) return globalRef.__hanaDb;

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const db = new DatabaseSync(DB_FILE);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");

  db.exec(SCHEMA_SQL);

  try {
    db.exec(FTS_SQL);
    globalRef.__hanaFts = true;
  } catch (error) {
    // FTS5 is compiled into most SQLite builds but is not guaranteed.
    // The search layer falls back to LIKE queries when it is missing.
    globalRef.__hanaFts = false;
    console.error("[db] FTS5 unavailable, falling back to LIKE search:", error);
  }

  db.prepare(
    "INSERT INTO _meta (key, value) VALUES ('schema_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(String(SCHEMA_VERSION));

  globalRef.__hanaDb = db;
  return db;
}

export function all<T>(sql: string, params: SqlValue[] = []): T[] {
  return getDb().prepare(sql).all(...params) as unknown as T[];
}

export function one<T>(sql: string, params: SqlValue[] = []): T | undefined {
  return getDb().prepare(sql).get(...params) as unknown as T | undefined;
}

export function run(sql: string, params: SqlValue[] = []) {
  return getDb().prepare(sql).run(...params);
}

export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
