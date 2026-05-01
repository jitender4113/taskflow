const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'taskflow.db');

let _db;
let _wrapper;

async function initDb() {
  const sqlJs = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new sqlJs.Database(fileBuffer);
  } else {
    _db = new sqlJs.Database();
  }

  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#6366f1',
      owner_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT DEFAULT (datetime('now')),
      UNIQUE(project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      project_id TEXT NOT NULL,
      assignee_id TEXT,
      creator_id TEXT NOT NULL,
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
`);

  _save();
  _wrapper = _makeWrapper();
  
  // Seed demo data on fresh database
  if (!fs.existsSync(DB_PATH)) {
    _seedDemoData();
  }
  
  return _wrapper;
}

function _seedDemoData() {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');
  
  const adminId = uuidv4();
  const memberId = uuidv4();
  const projectId = uuidv4();
  
  // Create demo admin
  _db.run(
    'INSERT INTO users (id, name, email, password, avatar_color) VALUES (?, ?, ?, ?, ?)',
    [adminId, 'Admin User', 'admin@example.com', bcrypt.hashSync('admin123', 10), '#6366f1']
  );
  
  // Create demo member
  _db.run(
    'INSERT INTO users (id, name, email, password, avatar_color) VALUES (?, ?, ?, ?, ?)',
    [memberId, 'Demo Member', 'member@example.com', bcrypt.hashSync('member123', 10), '#10b981']
  );
  
  // Create demo project
  _db.run(
    'INSERT INTO projects (id, name, description, color, owner_id) VALUES (?, ?, ?, ?, ?)',
    [projectId, 'Demo Project', 'This is a demo project for testing', '#6366f1', adminId]
  );
  
  // Add admin as project owner
  _db.run(
    'INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)',
    [uuidv4(), projectId, adminId, 'admin']
  );
  
  // Add member to project
  _db.run(
    'INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)',
    [uuidv4(), projectId, memberId, 'member']
  );
  
  // Create demo tasks
  const task1Id = uuidv4();
  const task2Id = uuidv4();
  
  _db.run(
    'INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [task1Id, 'Welcome Task', 'Welcome to your task manager!', 'todo', 'high', projectId, adminId, adminId]
  );
  
  _db.run(
    'INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [task2Id, 'Another Task', 'This is another demo task', 'in-progress', 'medium', projectId, memberId, adminId]
  );
  
  console.log('Demo data seeded: admin@example.com / admin123, member@example.com / member123');
}

function _save() {
  if (!_db) return;
  try {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch(e) { console.error('DB save error:', e.message); }
}

setInterval(_save, 3000);
process.on('exit', _save);

function _makeWrapper() {
  return {
    prepare: (sql) => ({
      run: (...params) => {
        _db.run(sql, params.flat());
        _save();
        return { changes: _db.getRowsModified() };
      },
      get: (...params) => {
        const stmt = _db.prepare(sql);
        stmt.bind(params.flat());
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
        const stmt = _db.prepare(sql);
        stmt.bind(params.flat());
        while (stmt.step()) results.push(stmt.getAsObject());
        stmt.free();
        return results;
      }
    }),
    exec: (sql) => {
      _db.run(sql);
      _save();
    }
  };
}

function getDb() {
  if (!_wrapper) throw new Error('DB not initialized');
  return _wrapper;
}

module.exports = { initDb, getDb };
