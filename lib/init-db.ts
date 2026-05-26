import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 执行数据库初始化：
//   npm run init-db

const dbPath = process.env.DB_PATH || '.data/blog.db';
const resolvedPath = path.resolve(dbPath);

const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function initDatabase() {
  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');

  try {
    // 创建 users 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);

    // 创建 blogs 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS blogs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // 创建 images 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        mimetype TEXT NOT NULL,
        data TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // 检查是否已有默认用户
    const existingUser = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin') as { count: number };

    if (existingUser.count === 0) {
      db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(
        '1',
        'admin',
        '$2a$10$8K1p/a0dL1LXMIgoEDFrgOBkP8f0yCkpIzrF6Io7rD0kHsLcVF8S2'
      );
      console.log('默认用户 admin 已创建');
    }

    console.log('数据库初始化完成！');
  } finally {
    db.close();
  }
}

initDatabase();
