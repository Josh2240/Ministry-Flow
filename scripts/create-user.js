import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getPool } from '../server/db.js';

dotenv.config({ path: '.env.local' });

const email = process.argv[2]?.trim().toLowerCase();
const role = process.argv[3] || 'user';
if (!email || !['user', 'admin'].includes(role)) {
  console.error('Usage: npm run user:create -- <email> [user|admin]');
  process.exit(1);
}

const password = randomBytes(24).toString('base64url');
const passwordHash = await bcrypt.hash(password, 12);
const pool = getPool('DATABASE_ADMIN_URL');
try {
  await pool.query(
    `INSERT INTO app_users (email, password_hash, role)
     VALUES ($1, $2, $3)`,
    [email, passwordHash, role]
  );
  console.log(`Created ${role} account for ${email}. Temporary password (shown once): ${password}`);
  console.log('Deliver this password securely and have the user reset it after signing in.');
} catch (error) {
  console.error('Could not create account:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
