import { query } from './config-database.js';

async function checkDatabase() {
  console.log('\n--- 🔍 SUPABASE DATABASE DIAGNOSTIC SCAN ---\n');
  
  try {
    // 1. Check Tables and Row Counts
    console.log('📊 CHECKING TABLES & ROW COUNTS:');
    const tables = ['users', 'animals', 'weight_records', 'feed_logs', 'vet_records'];
    
    for (const table of tables) {
      try {
        const res = await query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ [${table}] exists. Rows: ${res.rows[0].count}`);
      } catch (err) {
        console.log(`❌ [${table}] missing or error: ${err.message}`);
      }
    }

    // 2. Check Row Level Security (RLS) Status
    console.log('\n🛡️ CHECKING ROW LEVEL SECURITY (RLS) STATUS:');
    const rlsQuery = await query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname IN ('animals', 'weight_records', 'feed_logs', 'vet_records', 'users');
    `);
    
    rlsQuery.rows.forEach(row => {
      const isSecure = row.relrowsecurity;
      console.log(`${isSecure ? '🔒 SECURED' : '⚠️ VULNERABLE'} - Table [${row.relname}]: RLS is ${isSecure ? 'ON' : 'OFF'}`);
    });

    // 3. Check Active RLS Policies
    console.log('\n📜 CHECKING ACTIVE ISOLATION POLICIES:');
    const policyQuery = await query(`
      SELECT tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public';
    `);
    
    if (policyQuery.rows.length === 0) {
      console.log('⚠️ No RLS Policies found! Users might be locked out or data might be public.');
    } else {
      policyQuery.rows.forEach(p => {
        console.log(`✓ Policy found on [${p.tablename}]: "${p.policyname}"`);
      });
    }

    console.log('\n--- SCAN COMPLETE ---\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal Diagnostic Error:', error);
    process.exit(1);
  }
}

checkDatabase();
