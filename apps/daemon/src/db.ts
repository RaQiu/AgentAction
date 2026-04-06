import fs from "node:fs";
import path from "node:path";

type RecordKind =
  | "templates"
  | "roles"
  | "equipment"
  | "runtimes"
  | "providers"
  | "tasks";

interface DatabaseLike {
  list<T>(kind: RecordKind): T[];
  get<T>(kind: RecordKind, id: string): T | undefined;
  upsert<T extends { id: string }>(kind: RecordKind, value: T, updatedAt: string): void;
  appendEvent(taskId: string | undefined, type: string, payload: unknown, createdAt: string): void;
}

class JsonFallbackDatabase implements DatabaseLike {
  private readonly stateFile: string;
  private state: {
    records: Array<{ id: string; kind: RecordKind; data: string; updated_at: string }>;
    events: Array<{ task_id?: string; type: string; payload: string; created_at: string }>;
  };

  constructor(dbFile: string) {
    this.stateFile = dbFile.replace(/\.db$/, ".json");
    fs.mkdirSync(path.dirname(this.stateFile), { recursive: true });
    this.state = fs.existsSync(this.stateFile)
      ? JSON.parse(fs.readFileSync(this.stateFile, "utf-8"))
      : { records: [], events: [] };
  }

  private persist(): void {
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  list<T>(kind: RecordKind): T[] {
    return this.state.records
      .filter((row) => row.kind === kind)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((row) => JSON.parse(row.data) as T);
  }

  get<T>(kind: RecordKind, id: string): T | undefined {
    const row = this.state.records.find((item) => item.kind === kind && item.id === id);
    return row ? (JSON.parse(row.data) as T) : undefined;
  }

  upsert<T extends { id: string }>(kind: RecordKind, value: T, updatedAt: string): void {
    const row = {
      id: value.id,
      kind,
      data: JSON.stringify(value),
      updated_at: updatedAt
    };
    const index = this.state.records.findIndex((item) => item.id === value.id);
    if (index >= 0) {
      this.state.records[index] = row;
    } else {
      this.state.records.push(row);
    }
    this.persist();
  }

  appendEvent(taskId: string | undefined, type: string, payload: unknown, createdAt: string): void {
    this.state.events.push({
      task_id: taskId,
      type,
      payload: JSON.stringify(payload),
      created_at: createdAt
    });
    this.persist();
  }
}

class SqliteDatabase implements DatabaseLike {
  private readonly db: import("better-sqlite3").Database;

  constructor(dbFile: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BetterSqlite3 = require("better-sqlite3");
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    this.db = new BetterSqlite3(dbFile);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  list<T>(kind: RecordKind): T[] {
    const rows = this.db
      .prepare("SELECT data FROM records WHERE kind = ? ORDER BY updated_at DESC")
      .all(kind) as Array<{ data: string }>;

    return rows.map((row) => JSON.parse(row.data) as T);
  }

  get<T>(kind: RecordKind, id: string): T | undefined {
    const row = this.db
      .prepare("SELECT data FROM records WHERE kind = ? AND id = ? LIMIT 1")
      .get(kind, id) as { data: string } | undefined;

    if (!row) {
      return undefined;
    }

    return JSON.parse(row.data) as T;
  }

  upsert<T extends { id: string }>(kind: RecordKind, value: T, updatedAt: string): void {
    this.db
      .prepare(
        `
          INSERT INTO records (id, kind, data, updated_at)
          VALUES (@id, @kind, @data, @updated_at)
          ON CONFLICT(id) DO UPDATE SET
            data = excluded.data,
            updated_at = excluded.updated_at,
            kind = excluded.kind
        `
      )
      .run({
        id: value.id,
        kind,
        data: JSON.stringify(value),
        updated_at: updatedAt
      });
  }

  appendEvent(taskId: string | undefined, type: string, payload: unknown, createdAt: string): void {
    this.db
      .prepare(
        "INSERT INTO events (task_id, type, payload, created_at) VALUES (?, ?, ?, ?)"
      )
      .run(taskId ?? null, type, JSON.stringify(payload), createdAt);
  }
}

export class LocalDatabase {
  private readonly db: DatabaseLike;

  constructor(dbFile: string) {
    try {
      this.db = new SqliteDatabase(dbFile);
    } catch {
      this.db = new JsonFallbackDatabase(dbFile);
    }
  }

  list<T>(kind: RecordKind): T[] {
    return this.db.list<T>(kind);
  }

  get<T>(kind: RecordKind, id: string): T | undefined {
    return this.db.get<T>(kind, id);
  }

  upsert<T extends { id: string }>(kind: RecordKind, value: T, updatedAt: string): void {
    this.db.upsert(kind, value, updatedAt);
  }

  appendEvent(taskId: string | undefined, type: string, payload: unknown, createdAt: string): void {
    this.db.appendEvent(taskId, type, payload, createdAt);
  }
}
