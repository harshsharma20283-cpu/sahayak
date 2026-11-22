import { createClient, type Client as LibSqlClient } from "@libsql/client/web";
import { hasMojibake, repairMojibakeString } from "./encoding";

export interface DbRow {
  [key: string]: unknown;
}

export interface DbResult {
  columns: string[];
  rows: DbRow[];
  rowsAffected: number;
  lastInsertRowid?: bigint | number;
}

export interface DbClient {
  execute(stmt: string | { sql: string; args?: unknown[] | Record<string, unknown> }): Promise<DbResult>;
  executeMultiple(sql: string): Promise<void>;
  batch(
    stmts: Array<string | { sql: string; args?: unknown[] | Record<string, unknown> }>,
    mode?: "write" | "read" | "deferred"
  ): Promise<DbResult[]>;
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schemes (
  id TEXT PRIMARY KEY,
  json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  scheme_id TEXT NOT NULL,
  district TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  scheme_id TEXT NOT NULL,
  status TEXT NOT NULL,
  checklist_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  next_reminder_date TEXT
);
CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  display_name TEXT NOT NULL,
  profile_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

let schemaInitialized = false;
let schemaPromise: Promise<void> | null = null;

export async function initSchema(client: DbClient): Promise<void> {
  if (schemaInitialized) return;
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await client.executeMultiple(SCHEMA_SQL);
      schemaInitialized = true;
    })();
  }
  return schemaPromise;
}

class TursoClientWrapper implements DbClient {
  private client: LibSqlClient;

  constructor(url: string, authToken?: string) {
    this.client = createClient({ url, authToken });
  }

  async execute(stmt: string | { sql: string; args?: unknown[] | Record<string, unknown> }): Promise<DbResult> {
    await initSchema(this);
    const sql = typeof stmt === "string" ? stmt : stmt.sql;
    const args = typeof stmt === "string" ? [] : (stmt.args ?? []);
    // libSQL accepts array or named args
    const res = await this.client.execute({ sql, args: args as any });
    const rows = res.rows.map((row) => {
      const obj: Record<string, unknown> = {};
      for (let i = 0; i < res.columns.length; i++) {
        const col = res.columns[i];
        obj[col] = (row as any)[col] !== undefined ? (row as any)[col] : (row as any)[i];
      }
      return obj;
    });
    return {
      columns: res.columns,
      rows,
      rowsAffected: res.rowsAffected,
      lastInsertRowid: res.lastInsertRowid,
    };
  }

  async executeMultiple(sql: string): Promise<void> {
    await this.client.executeMultiple(sql);
  }

  async batch(
    stmts: Array<string | { sql: string; args?: unknown[] | Record<string, unknown> }>,
    mode?: "write" | "read" | "deferred"
  ): Promise<DbResult[]> {
    await initSchema(this);
    const inStmts = stmts.map((s) => (typeof s === "string" ? s : { sql: s.sql, args: (s.args ?? []) as any }));
    const batchRes = await this.client.batch(inStmts, mode);
    return batchRes.map((res) => {
      const rows = res.rows.map((row) => {
        const obj: Record<string, unknown> = {};
        for (let i = 0; i < res.columns.length; i++) {
          const col = res.columns[i];
          obj[col] = (row as any)[col] !== undefined ? (row as any)[col] : (row as any)[i];
        }
        return obj;
      });
      return {
        columns: res.columns,
        rows,
        rowsAffected: res.rowsAffected,
        lastInsertRowid: res.lastInsertRowid,
      };
    });
  }
}

class LocalSqliteClientWrapper implements DbClient {
  private db: any = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  private getInternalDb() {
    if (this.db) return this.db;
    const { DatabaseSync } = require("node:sqlite");
    const { mkdirSync } = require("node:fs");
    const path = require("node:path");

    mkdirSync(path.dirname(this.dbPath), { recursive: true });
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec("PRAGMA encoding = 'UTF-8'; PRAGMA journal_mode = WAL;");
    return this.db;
  }

  async execute(stmt: string | { sql: string; args?: unknown[] | Record<string, unknown> }): Promise<DbResult> {
    await initSchema(this);
    const db = this.getInternalDb();
    const sql = typeof stmt === "string" ? stmt : stmt.sql;
    const rawArgs = typeof stmt === "string" ? [] : (stmt.args ?? []);
    const args = Array.isArray(rawArgs) ? rawArgs : Object.values(rawArgs);

    const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sql);
    if (isSelect) {
      const prepared = db.prepare(sql);
      const rows = prepared.all(...args) as DbRow[];
      return {
        columns: rows.length > 0 ? Object.keys(rows[0]) : [],
        rows,
        rowsAffected: 0,
      };
    } else {
      const prepared = db.prepare(sql);
      const result = prepared.run(...args);
      return {
        columns: [],
        rows: [],
        rowsAffected: Number(result.changes),
        lastInsertRowid: result.lastInsertRowid,
      };
    }
  }

  async executeMultiple(sql: string): Promise<void> {
    const db = this.getInternalDb();
    db.exec(sql);
  }

  async batch(
    stmts: Array<string | { sql: string; args?: unknown[] | Record<string, unknown> }>,
    _mode?: "write" | "read" | "deferred"
  ): Promise<DbResult[]> {
    await initSchema(this);
    const db = this.getInternalDb();
    db.exec("BEGIN");
    try {
      const results: DbResult[] = [];
      for (const s of stmts) {
        results.push(await this.execute(s));
      }
      db.exec("COMMIT");
      return results;
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }
}

let dbInstance: DbClient | null = null;

export function getDb(): DbClient {
  if (dbInstance) return dbInstance;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    dbInstance = new TursoClientWrapper(tursoUrl, tursoToken);
  } else {
    const path = require("node:path");
    const localDbPath = path.resolve(process.cwd(), "data", "sahayak.db");
    dbInstance = new LocalSqliteClientWrapper(localDbPath);
  }

  return dbInstance;
}
