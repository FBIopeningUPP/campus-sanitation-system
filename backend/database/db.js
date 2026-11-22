const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/sanitation.db');

let db = null;
let SQL = null;

// Initialize SQL.js and load/create database
async function initDB() {
  if (db) return db;
  
  SQL = await initSqlJs();
  
  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
  } catch (error) {
    console.error('Error loading database:', error);
    db = new SQL.Database();
  }
  
  return db;
}

// Save database to file
function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Wrapper to make sql.js work like better-sqlite3 API
function prepare(sql) {
  return {
    run: (...params) => {
      db.run(sql, params);
      saveDB();
      return { changes: db.getRowsModified() };
    },
    get: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all: (...params) => {
      const results = [];
      const stmt = db.prepare(sql);
      stmt.bind(params);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }
  };
}

function exec(sql) {
  db.exec(sql);
  saveDB();
}

function pragma(sql) {
  db.exec(`PRAGMA ${sql}`);
}

// Export a proxy that initializes on first use
module.exports = {
  initDB,
  prepare: (sql) => prepare(sql),
  exec: (sql) => exec(sql),
  pragma: (sql) => pragma(sql),
  saveDB,
  get db() { return db; }
};
