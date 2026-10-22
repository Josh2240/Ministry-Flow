import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool(environmentKey = 'DATABASE_URL') {
  const connectionString = process.env[environmentKey];
  if (!connectionString) {
    throw new Error(`${environmentKey} is required. Configure a pooled PostgreSQL connection string.`);
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: true,
    });
  }

  return pool;
}

export async function query(text, values) {
  return getPool().query(text, values);
}
