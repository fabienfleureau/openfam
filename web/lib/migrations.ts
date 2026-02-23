import { getPool } from './db.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
  name: string;
  sql?: string;
  sqlFile?: string;
}

const migrations: Migration[] = [
  {
    name: '001_initial_schema',
    sql: `
      -- Profiles: Child profiles with schedules and rules
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Devices: Network devices linked to profiles
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        mac_address TEXT NOT NULL UNIQUE,
        hostname TEXT,
        profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
        last_seen TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Schedule rules for profiles
      CREATE TABLE IF NOT EXISTS schedule_rules (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        time_range TEXT NOT NULL, -- Format: "HH:MM-HH:MM"
        mode TEXT NOT NULL, -- 'homework', 'free_time', 'sleep'
        apps JSONB, -- Array of app rules like ["tiktok:block", "roblox:block"]
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Index for faster device lookups by MAC
      CREATE INDEX IF NOT EXISTS idx_devices_mac ON devices(mac_address);

      -- Index for schedule lookups
      CREATE INDEX IF NOT EXISTS idx_schedule_profile ON schedule_rules(profile_id);
    `
  },
  {
    name: '002_create_family_profiles_table',
    sqlFile: './migrations/002_create_family_profiles_table.sql'
  }
];

let migrationsRun = false;

export async function runMigrations(): Promise<void> {
  if (migrationsRun) {
    return;
  }

  // Ensure DATABASE_URL is available
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    console.warn('DATABASE_URL not set, skipping migrations');
    return;
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    for (const migration of migrations) {
      // Check if migration already ran
      const result = await client.query(
        'SELECT id FROM _migrations WHERE id = $1',
        [migration.name]
      );

      if (result.rows.length === 0) {
        console.log(`Running migration: ${migration.name}`);
        await client.query('BEGIN');

        try {
          // Get SQL - either inline or from file
          let sql = migration.sql;
          if (migration.sqlFile) {
            const sqlPath = join(__dirname, migration.sqlFile);
            sql = readFileSync(sqlPath, 'utf-8');
          }

          // Ensure we have SQL to execute
          if (!sql) {
            throw new Error(`Migration ${migration.name} has no SQL to execute`);
          }

          await client.query(sql);
          await client.query('INSERT INTO _migrations (id) VALUES ($1)', [migration.name]);
          await client.query('COMMIT');
          console.log(`✓ Migration ${migration.name} complete`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      }
    }

    migrationsRun = true;
    console.log('All migrations up to date');
  } finally {
    client.release();
  }
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
