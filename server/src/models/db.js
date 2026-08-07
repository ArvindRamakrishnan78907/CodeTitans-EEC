import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In serverless (Netlify), use /tmp for writable storage
// In local dev, use the project database directory
const isServerless = process.env.NETLIFY === 'true' || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DB_FILE = isServerless
  ? '/tmp/urlshortener.db'
  : path.resolve(__dirname, '../../', config.dbPath);

let db = null;

/**
 * Initialize and return the database instance (sql.js)
 */
export async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing database file if it exists
  const dbDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    const buffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
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
    )
  `);

  db.run(`
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
    )
  `);

  // Create indexes
  db.run('CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code)');
  db.run('CREATE INDEX IF NOT EXISTS idx_urls_is_active ON urls(is_active)');
  db.run('CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON clicks(url_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at)');

  // Save to file
  saveDb();

  console.log(`✅ Database initialized (${isServerless ? 'serverless' : 'local'})`);
  return db;
}

/**
 * Save the in-memory database to disk
 */
export function saveDb() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE, buffer);
    } catch (e) {
      console.error('Error saving DB:', e);
    }
  }
}

/**
 * Close the database
 */
export function closeDb() {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}

/**
 * Helper: run a query and return all results as an array of objects
 */
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * Helper: run a query and return the first result as an object
 */
export function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);

  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

/**
 * Helper: run an INSERT/UPDATE/DELETE and return changes info
 */
export function execute(sql, params = []) {
  db.run(sql, params);
  const changes = db.getRowsModified();
  const lastId = queryOne('SELECT last_insert_rowid() as id');
  return { changes, lastInsertRowid: lastId?.id };
}
