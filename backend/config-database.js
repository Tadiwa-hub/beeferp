/**
 * Database Configuration
 * Supabase PostgreSQL connection using pg (node-postgres)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

const { Pool } = pg;

/**
 * FORCE IPv4 Resolution for Render Cloud compatibility.
 * This ensures the driver resolves hostnames to IPv4, but keeps the hostname 
 * in the connection so Supabase's proxy can route to the correct tenant.
 */
const ipv4Lookup = (hostname, options, callback) => {
  return dns.lookup(hostname, { family: 4 }, callback);
};

// Support both full connection string (SUPABASE_URL) or individual DB_ variables
let poolConfig = {};

if (process.env.SUPABASE_URL) {
  const rawUrl = process.env.SUPABASE_URL.trim();
  // Log a masked version for debugging
  const maskedUrl = rawUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔌 Attempting connection using SUPABASE_URL: ${maskedUrl}`);
  poolConfig = { connectionString: rawUrl };
} else {
  console.log(`🔌 Attempting connection using individual DB_ variables to host: ${process.env.DB_HOST}`);
  poolConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
  };
}

// Create connection pool with forced IPv4 lookup and SSL
const pool = new Pool({
  ...poolConfig,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  lookup: ipv4Lookup,
});

// Connection event handlers
pool.on('error', (err) => console.error('Unexpected error on idle client:', err.message));
pool.on('connect', () => console.log('✓ Database pool connected'));

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

export default { query, getOne, getAll, testConnection };
