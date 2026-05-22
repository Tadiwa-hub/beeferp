import { query } from './config-database.js';

async function listUsers() {
  try {
    const res = await query('SELECT id, username, email, is_active FROM users');
    console.log('\n--- 👥 USERS IN DATABASE ---\n');
    res.rows.forEach(u => {
      console.log(`- [${u.id}] User: ${u.username} | Email: ${u.email} | Active: ${u.is_active}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listUsers();
