import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || '.data/blog.db';
const resolvedPath = path.resolve(dbPath);

// 确保数据库目录存在
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(resolvedPath);

// 启用 WAL 模式提高并发性能
db.pragma('journal_mode = WAL');

export default db;
