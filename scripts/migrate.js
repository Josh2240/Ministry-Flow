import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { getPool } from '../server/db.js';

dotenv.config({ path: '.env.local' });

const pool = getPool('DATABASE_ADMIN_URL');
try {
  const schema = await readFile(resolve('db/schema.sql'), 'utf8');
  const privileges = await readFile(resolve('db/privileges.sql'), 'utf8');
  await pool.query(schema);
  await pool.query(privileges);
  console.log('Database schema and runtime privileges applied.');
} catch (error) {
  console.error('Database migration failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
