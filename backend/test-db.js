import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function runDirectTest() {
  console.log('Testing direct IP connection to Supabase...');
  
  // Replace the hostname with the resolved IPv6 address enclosed in square brackets
  const directUrl = process.env.SUPABASE_URL.replace(
    'db.jlevzblbzfcpjubztyws.supabase.co',
    '[2a05:d014:1e9b:b301:32e:48c7:bf2e:26e]'
  );

  // Remove ?sslmode=require from connection string to prevent pg-connection-string from overriding our custom ssl options
  const cleanDirectUrl = directUrl.split('?')[0];

  console.log('Direct Connection URL (clean):', cleanDirectUrl);

  const pool = new Pool({
    connectionString: cleanDirectUrl,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000,
  });

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('SUCCESS ✓ Connected directly using IP address!', result.rows[0]);
  } catch (err) {
    console.error('FAILED ✗ Direct IP connection error:', err.message);
  } finally {
    await pool.end();
  }
}

runDirectTest();
