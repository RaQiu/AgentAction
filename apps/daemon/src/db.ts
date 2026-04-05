import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

type RecordKind =
  | "templates"
  | "roles"
  | "equipment"
  | "runtimes"
  | "providers"
  | "tasks";

export class LocalDatabase {
  private readonly db: Database.Database;

  constructor(dbFile: string) {
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    this.db = new Database(dbFile);
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
