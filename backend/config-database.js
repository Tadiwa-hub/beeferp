/**
 * Database Configuration
 * Supabase PostgreSQL connection using pg (node-postgres)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';
import { promisify } from 'util';

dotenv.config();

const resolve4 = promisify(dns.resolve4);

/**
 * Manually resolves a hostname to an IPv4 address.
 * This is the ultimate fallback to prevent the `pg` client from attempting IPv6 on Render.
 */
async function getIpv4Address(hostname) {
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return hostname;
  }
  
  try {
    const addresses = await resolve4(hostname);
    if (addresses && addresses.length > 0) {
      console.log(`📡 Manually resolved ${hostname} to IPv4: ${addresses[0]}`);
      return addresses[0];
    }
  } catch (error) {
    console.warn(`⚠️ Failed to resolve IPv4 for ${hostname}. Falling back to original.`, error.message);
  }
  return hostname;
}

const { Pool } = pg;
let pool;

/**
 * Initializes the database pool asynchronously to allow for manual DNS resolution.
 */
async function initPool() {
  if (pool) return pool;

  let connectionConfig = {};

  if (process.env.SUPABASE_URL) {
    try {
      // 1. Parse the URL to extract the hostname
      const url = new URL(process.env.SUPABASE_URL.split('?')[0]);
      
      // 2. Manually resolve the hostname to an IPv4 address
      const ipv4Host = await getIpv4Address(url.hostname);
      
      // 3. Reconstruct the connection string using the raw IPv4 address
      url.hostname = ipv4Host;
      connectionConfig = { connectionString: url.toString() };
      
    } catch (e) {
      console.error("Failed to parse SUPABASE_URL. Check your connection string format.", e);
      // Fallback to raw string if parsing fails, though this might trigger the IPv6 bug again
      connectionConfig = { connectionString: process.env.SUPABASE_URL.split('?')[0] };
    }
  } else {
    // If using individual variables, resolve the DB_HOST first
    const originalHost = process.env.DB_HOST;
    const ipv4Host = await getIpv4Address(originalHost);
    
    connectionConfig = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: ipv4Host,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
    };
  }

  // Create connection pool with enforced SSL
  pool = new Pool({
    ...connectionConfig,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });

  pool.on('error', (err) => console.error('Unexpected error on idle client:', err.message));
  pool.on('connect', () => console.log('✓ Database pool connected'));

  return pool;
}

// Singleton pool instance promise
const getPool = async () => await initPool();

/**
 * Execute query with connection pooling
 */
export const query = async (text, params) => {
  const start = Date.now();
  const activePool = await getPool();
  try {
    const res = await activePool.query(text, params);
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
    const activePool = await getPool();
    const result = await activePool.query('SELECT NOW()');
    console.log('✓ Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
};

export default { query, getOne, getAll, testConnection };
