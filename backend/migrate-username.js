/**
 * Database Migration Script
 * Adds unique username column to users table and populates it based on email
 */

import { query } from './config-database.js';

async function migrate() {
  console.log('Starting migration to username-based auth...');
  try {
    // 1. Add column if not exists
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;
    `, []);
    console.log('✓ Added username column');

    // 2. Populate usernames based on email for existing users
    const usersRes = await query('SELECT id, email FROM users', []);
    for (const row of usersRes.rows) {
      // e.g. bob@example.com -> bob
      let baseUsername = row.email.split('@')[0].toLowerCase();
      
      // Ensure unique username
      let username = baseUsername;
      let counter = 1;
      while (true) {
        const check = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, row.id]);
        if (check.rowCount === 0) break;
        username = `${baseUsername}${counter}`;
        counter++;
      }

      await query('UPDATE users SET username = $1 WHERE id = $2', [username, row.id]);
      console.log(`✓ Set username for user ${row.email} to: ${username}`);
    }

    // 3. Make username NOT NULL
    await query(`
      ALTER TABLE users 
      ALTER COLUMN username SET NOT NULL;
    `, []);
    console.log('✓ Username column configured as NOT NULL');

    // 4. Remove unique constraint on email to allow optional or duplicate empty emails, or make email nullable
    await query(`
      ALTER TABLE users 
      ALTER COLUMN email DROP NOT NULL;
    `, []);
    console.log('✓ Email column configured as NULLable');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
