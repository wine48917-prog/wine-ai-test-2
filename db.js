import mysql from 'mysql2/promise';

if (!global.dbPool) {
  global.dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // ✅ إضافات للسرعة
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  });
}

export default global.dbPool;
