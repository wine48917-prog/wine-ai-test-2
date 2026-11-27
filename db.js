import mysql from 'mysql2/promise';
import crypto from 'node:crypto';

if (!global.dbPool) {
  global.dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 5000,
    maxIdle: 5,
    idleTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  });
}

const pool = global.dbPool;
let schemaPromise;

export function ensureDatabase() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(64) NOT NULL UNIQUE,
        device_id VARCHAR(100) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        usage_count INT NOT NULL DEFAULT 0,
        reset_time BIGINT NOT NULL DEFAULT 0,
        is_dev TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      await pool.query(`CREATE TABLE IF NOT EXISTS rate_limits (
        rk VARCHAR(190) NOT NULL PRIMARY KEY,
        cnt INT NOT NULL DEFAULT 0,
        reset_at BIGINT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      await pool.query(`CREATE TABLE IF NOT EXISTS site_settings (setting_key VARCHAR(80) NOT NULL PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      await pool.query(`CREATE TABLE IF NOT EXISTS site_visits (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, visitor_id CHAR(36) NOT NULL, visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_site_visits_date (visited_at), INDEX idx_site_visits_visitor_date (visitor_id, visited_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      await pool.query(`CREATE TABLE IF NOT EXISTS complaints (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, category VARCHAR(40) NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_complaints_created_at (created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      await pool.execute("INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('analytics_started_at', NOW())");
      await pool.query('SELECT 1');
      return true;
    })().catch(error => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

export default pool;


export async function recordSiteVisit(req, res) {
  await ensureDatabase();
  const cookies = String(req.headers.cookie || '');
  const match = cookies.match(/(?:^|;\s*)wine_vid=([a-f0-9-]{36})(?:;|$)/i);
  const visitorId = match ? match[1] : crypto.randomUUID();
  if (!match) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.append('Set-Cookie', `wine_vid=${visitorId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`);
  }
  await pool.execute('INSERT INTO site_visits (visitor_id) VALUES (?)', [visitorId]);
}

export async function getSiteAnalytics() {
  await ensureDatabase();
  const [rows] = await pool.query(`SELECT
    COUNT(*) AS totalVisits,
    COUNT(DISTINCT visitor_id) AS uniqueVisitors,
    COALESCE(SUM(visited_at >= CURDATE()), 0) AS todayVisits,
    COUNT(DISTINCT CASE WHEN visited_at >= CURDATE() THEN visitor_id END) AS todayUnique
    FROM site_visits`);
  const row = rows[0] || {};
  return {
    totalVisits: Number(row.totalVisits || 0),
    uniqueVisitors: Number(row.uniqueVisitors || 0),
    todayVisits: Number(row.todayVisits || 0),
    todayUnique: Number(row.todayUnique || 0)
  };
}
