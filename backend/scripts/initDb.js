const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const dbPath = path.join(__dirname, '../../database/sanitation.db');

async function initDatabase() {
  console.log('🔧 Initializing database...');

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS floors (
      id TEXT PRIMARY KEY,
      building_id TEXT NOT NULL,
      floor_number INTEGER NOT NULL,
      floor_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
      UNIQUE(building_id, floor_number)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS washrooms (
      id TEXT PRIMARY KEY,
      floor_id TEXT NOT NULL,
      name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female', 'unisex')) DEFAULT 'unisex',
      qr_code TEXT UNIQUE NOT NULL,
      average_rating REAL DEFAULT 0,
      total_ratings INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
    )
  `);

  db.run(`
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

  db.run(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      washroom_id TEXT NOT NULL,
      issue_type TEXT NOT NULL CHECK(issue_type IN ('dirty_toilet', 'missing_soap', 'water_shortage', 'broken_fixture', 'bad_odor', 'no_water', 'electrical', 'other')),
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

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'super_admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id TEXT PRIMARY KEY,
      ip_hash TEXT NOT NULL,
      action_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_floors_building ON floors(building_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_washrooms_floor ON washrooms(floor_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ratings_washroom ON ratings(washroom_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_issues_washroom ON issues(washroom_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_issues_created ON issues(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip_hash, action_type, created_at)`);

  // Create default admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bennett.edu.in';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = bcrypt.hashSync(adminPassword, 10);
  const adminId = uuidv4();

  db.run(`
    INSERT OR IGNORE INTO admin_users (id, email, password_hash, full_name, role)
    VALUES (?, ?, ?, ?, ?)
  `, [adminId, adminEmail, passwordHash, 'System Administrator', 'super_admin']);

  console.log(`✅ Created admin user: ${adminEmail}`);

  // Save to file
  const data = db.export();
  const buffer = Buffer.from(data);
  
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(dbPath, buffer);
  
  console.log('✅ Database initialized successfully!');
  console.log(`📁 Database location: ${dbPath}`);
  
  db.close();
}

initDatabase().catch(console.error);
