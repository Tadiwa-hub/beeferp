/**
 * Database Configuration
 * Supabase PostgreSQL connection using pg (node-postgres)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';
import { promisify } from 'util';

dotenv.config();

// Pre-resolve host to IPv4 to prevent ENETUNREACH on IPv6-only hostnames
const resolve4 = promisify(dns.resolve4);

const getIpv4Host = async (host) => {
  if (!host || host === 'localhost' || host === '127.0.0.1' || host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return host;
  }
  try {
    const addresses = await resolve4(host);
    console.log(`📡 Resolved ${host} to IPv4: ${addresses[0]}`);
    return addresses[0];
  } catch (err) {
    console.warn(`⚠️ IPv4 resolution failed for ${host}, falling back to original hostname:`, err.message);
    return host;
  }
};

const { Pool } = pg;

// We will initialize the pool inside a wrapper to allow for async DNS resolution
let pool;

const initPool = async () => {
  if (pool) return pool;

  const originalHost = process.env.DB_HOST || (process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : '');
  const ipv4Host = await getIpv4Host(originalHost);

  const poolConfig = process.env.SUPABASE_URL 
    ? { connectionString: process.env.SUPABASE_URL.split('?')[0].replace(originalHost, ipv4Host) }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: ipv4Host,
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME,
      };

  pool = new Pool({
    ...poolConfig,
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
};

// Singleton pool instance for the app
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
