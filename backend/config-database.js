/**
 * Database Configuration
 * Supabase PostgreSQL connection using pg (node-postgres)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// FORCE Node.js to prioritize IPv4 over IPv6 globally.
// This is the definitive fix for "ENETUNREACH" errors on Render and other IPv4-only hosts.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const { Pool } = pg;

// Support both full connection string (SUPABASE_URL) or individual DB_ variables
const poolConfig = process.env.SUPABASE_URL 
  ? { connectionString: process.env.SUPABASE_URL.split('?')[0] }
  : {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
    };

// Create connection pool for Supabase with enforced SSL
const pool = new Pool({
  ...poolConfig,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

// Connection event handlers
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err.message);
});

pool.on('connect', () => {
  console.log('✓ Database pool connected');
});

/**
 * Execute query with connection pooling
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`✓ Query executed (${duration}ms)`, { text: text.substring(0, 50), rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('✗ Query error:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      const dbError = new Error('Database is temporarily unreachable. Please try again shortly.');
      dbError.status = 503;
      dbError.name = 'ServiceUnavailable';
      throw dbError;
    }
    
    throw error;
  }
};

/**
 * Get single row or null
 */
export const getOne = async (text, params) => {
  const res = await query(text, params);
  return res.rows[0] || null;
};

/**
 * Get multiple rows
 */
export const getAll = async (text, params) => {
  const res = await query(text, params);
  return res.rows;
};

/**
 * Test database connection
 */
export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
};

/**
 * Close pool gracefully
 */
export const closePool = async () => {
  await pool.end();
  console.log('✓ Database pool closed');
};

export default pool;
