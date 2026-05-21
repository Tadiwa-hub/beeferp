/**
 * Database Configuration
 * Supabase PostgreSQL connection using pg (node-postgres)
 */

import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Configure Node to use robust public DNS servers (Cloudflare + Google) directly
// This completely bypasses buggy/restrictive local network router DNS proxies!
try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
  console.log('✓ Injected custom robust DNS servers (1.1.1.1, 8.8.8.8)');
} catch (dnsErr) {
  console.warn('⚠️ WARNING: Could not set custom DNS servers:', dnsErr.message);
}

const { Pool } = pg;

// Custom robust DNS lookup function that forces IPv4 (A) resolution first
// Render and many cloud hosts do not support outbound IPv6 correctly, causing ENETUNREACH errors.
const robustLookup = (hostname, options, callback) => {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return dns.lookup(hostname, options, callback);
  }

  // FORCE IPv4 Resolution for Render Cloud compatibility
  dns.resolve(hostname, 'A', (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      return callback(null, addresses[0], 4);
    }
    
    // Fallback to IPv6 if IPv4 fails (e.g. some strict Supabase setups)
    dns.resolve(hostname, 'AAAA', (err2, addresses2) => {
      if (!err2 && addresses2 && addresses2.length > 0) {
        return callback(null, addresses2[0], 6);
      }
      // Absolute fallback to OS default resolver
      return dns.lookup(hostname, options, callback);
    });
  });
};

// Clean connection string to prevent pg-connection-string from overriding rejectUnauthorized
const dbConnectionString = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.split('?')[0] : '';

// Create connection pool for Supabase
const pool = new Pool({
  connectionString: dbConnectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  lookup: robustLookup, // Inject our custom robust DNS resolver!
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
