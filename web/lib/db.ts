import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function query(text: string, params?: any[]): Promise<any[]> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function queryOne(text: string, params?: any[]): Promise<any> {
  const rows = await query(text, params);
  return rows[0] || null;
}
