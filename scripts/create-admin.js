import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getPool } from '../server/db.js';

dotenv.config({ path: '.env.local' });

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 12) {
  console.error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in .env.local or the environment.');
  process.exit(1);
}

const pool = getPool('DATABASE_ADMIN_URL');
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('ministry-flow-initial-admin'))");
  const existingAdmin = await client.query("SELECT 1 FROM app_users WHERE role = 'admin' LIMIT 1");
  if (existingAdmin.rowCount) {
    throw new Error('An administrator already exists. Use the account creation command for additional users.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await client.query(
    `INSERT INTO app_users (email, password_hash, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (lower(email)) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = 'admin',
       updated_at = now()`,
    [email, passwordHash]
  );
  await client.query('COMMIT');
  console.log(`Initial administrator is ready: ${email}`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error('Could not create initial administrator:', error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
