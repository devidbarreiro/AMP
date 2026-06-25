import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getAmpDir } from '../crypto/identity.js';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const ampDir = getAmpDir();
  mkdirSync(ampDir, { recursive: true, mode: 0o700 });

  db = new Database(join(ampDir, 'amp.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  migrate(db);
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      from_peer TEXT NOT NULL,
      to_peer TEXT NOT NULL,
      content TEXT,
      file_path TEXT,
      file_name TEXT,
      file_size INTEGER,
      direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'read', 'failed')),
      priority INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      delivered_at TEXT,
      read_at TEXT,
      expires_at TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
    CREATE INDEX IF NOT EXISTS idx_messages_to_peer ON messages(to_peer, status);
    CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction, status);

    CREATE TABLE IF NOT EXISTS peers (
      alias TEXT PRIMARY KEY,
      display_name TEXT,
      public_key TEXT NOT NULL UNIQUE,
      signing_key TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked')),
      last_seen TEXT,
      last_address TEXT,
      permissions TEXT NOT NULL DEFAULT '{"text":true,"files":true,"maxFileSize":524288000}',
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
