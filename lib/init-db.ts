import mysql from 'mysql2/promise';

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
  });

  try {
    // 创建数据库（如果不存在）
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'personal_blog'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('数据库已创建/确认存在');

    await connection.changeUser({ database: process.env.DB_NAME || 'personal_blog' });

    // 创建 users 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);

    // 创建 blogs 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS blogs (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(50) NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      )
    `);

    // 检查是否已有默认用户
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE username = ?',
      ['admin']
    );
    const count = (rows as any[])[0].count;

    if (count === 0) {
      await connection.execute(
        'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
        ['1', 'admin', '$2a$10$8K1p/a0dL1LXMIgoEDFrgOBkP8f0yCkpIzrF6Io7rD0kHsLcVF8S2']
      );
      console.log('默认用户 admin 已创建');
    }

    console.log('数据库初始化完成！');
  } finally {
    await connection.end();
  }
}

// 直接运行时执行初始化
initDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  });
