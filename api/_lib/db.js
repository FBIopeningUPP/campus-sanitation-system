import { createClient } from '@libsql/client';

let db = null;

export function getDb() {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

export async function initializeDatabase() {
  const db = getDb();
  
  // Create tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS floors (
      id TEXT PRIMARY KEY,
      building_id TEXT NOT NULL,
      floor_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS washrooms (
      id TEXT PRIMARY KEY,
      floor_id TEXT NOT NULL,
      name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female', 'unisex')) NOT NULL,
      qr_code TEXT UNIQUE,
      average_rating REAL DEFAULT 0,
      total_ratings INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      washroom_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      feedback TEXT,
      photo_url TEXT,
      ip_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (washroom_id) REFERENCES washrooms(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      washroom_id TEXT NOT NULL,
      issue_type TEXT NOT NULL,
      description TEXT,
      photo_url TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      ip_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (washroom_id) REFERENCES washrooms(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

// Helper to run queries
export async function query(sql, params = []) {
  const db = getDb();
  const result = await db.execute({ sql, args: params });
  return result.rows;
}

export async function run(sql, params = []) {
  const db = getDb();
  return await db.execute({ sql, args: params });
}
