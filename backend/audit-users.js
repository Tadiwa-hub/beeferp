import { query } from './config-database.js';

async function auditUsersTable() {
  console.log('\n--- 🕵️ USERS TABLE AUDIT ---\n');
  
  try {
    // 1. Check columns in users table
    console.log('📋 AUDITING COLUMNS:');
    const columnsRes = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    
    if (columnsRes.rows.length === 0) {
      console.log('❌ Table [users] DOES NOT EXIST!');
    } else {
      columnsRes.rows.forEach(col => {
        console.log(`✅ Column: ${col.column_name} (${col.data_type})`);
      });
    }

    // 2. Check if there are any users
    const countRes = await query('SELECT COUNT(*) FROM users');
    console.log(`\n👥 TOTAL USERS IN DB: ${countRes.rows[0].count}`);

    // 3. Test the exact query used in login (without real password comparison)
    console.log('\n🧪 TESTING LOGIN QUERY STRUCTURE:');
    try {
      const testQuery = await query(
        `SELECT id, name, username, email, role, password_hash 
         FROM users 
         WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)) AND is_active = true`,
        ['test_dummy_user']
      );
      console.log('✅ Login query structure is valid.');
    } catch (err) {
      console.log(`❌ Login query failed: ${err.message}`);
    }

    console.log('\n--- AUDIT COMPLETE ---\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal Audit Error:', error);
    process.exit(1);
  }
}

auditUsersTable();
