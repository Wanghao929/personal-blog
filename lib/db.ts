import mysql from 'mysql2/promise';

// Railway MySQL 环境变量
const host = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
const port = Number(process.env.MYSQLPORT || process.env.DB_PORT) || 3306;
const user = process.env.MYSQLUSER || process.env.DB_USER || 'root';
const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'root';
const database = process.env.MYSQLDATABASE || process.env.DB_NAME || 'personal_blog';

const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
