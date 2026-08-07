import Database from 'better-sqlite3';
import config from '../src/config/index.js';

const db = new Database(config.dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Core URLs table
  CREATE TABLE IF NOT EXISTS urls (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code    TEXT UNIQUE NOT NULL,
    original_url  TEXT NOT NULL,
    custom_alias  INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now')),
    expires_at    TEXT NULL,
    is_active     INTEGER DEFAULT 1,
    password_hash TEXT NULL,
    created_by    INTEGER NULL,
    click_count   INTEGER DEFAULT 0
  );

  -- Click analytics table
  CREATE TABLE IF NOT EXISTS clicks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    url_id        INTEGER NOT NULL,
    clicked_at    TEXT DEFAULT (datetime('now')),
    ip_hash       TEXT,
    user_agent    TEXT,
    referrer      TEXT,
    country       TEXT,
    city          TEXT,
    device_type   TEXT,
    browser       TEXT,
    os            TEXT,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
  CREATE INDEX IF NOT EXISTS idx_urls_is_active ON urls(is_active);
  CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON clicks(url_id);
  CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);
`);

console.log('✅ Database initialized successfully!');
console.log(`   Tables created in: ${config.dbPath}`);

db.close();
