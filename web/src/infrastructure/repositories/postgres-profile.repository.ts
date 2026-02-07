/**
 * PostgreSQL Profile Repository Implementation
 * Implements the ProfileRepository interface using native SQL
 */
import type { ProfileRepository } from '../../domain/repositories/profile.repository.interface';
import type { Profile, CreateProfileInput, UpdateProfileInput } from '../../domain/entities/profile.entity';
import { query, queryOne, transaction } from '../database/pool';

/**
 * Validate MAC address format (AA:BB:CC:DD:EE:FF)
 */
function isValidMacAddress(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}

/**
 * Normalize MAC address to use colons
 */
function normalizeMacAddress(mac: string): string {
  return mac.replace(/-/g, ':').toUpperCase();
}

/**
 * Map database row to Profile entity
 */
function mapToProfile(row: any): Profile {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    mac_addresses: row.mac_addresses || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const PostgresProfileRepository: ProfileRepository = {
  async create(input: CreateProfileInput): Promise<Profile> {
    return transaction(async (client) => {
      // Validate MAC addresses
      if (input.mac_addresses) {
        for (const mac of input.mac_addresses) {
          if (!isValidMacAddress(mac)) {
            throw new Error(`Invalid MAC address format: ${mac}`);
          }
        }
      }

      // Insert profile
      const profileResult = await client.query(
        `INSERT INTO profiles (name, description)
         VALUES ($1, $2)
         RETURNING id, name, description, created_at, updated_at`,
        [input.name, input.description || null]
      );

      const profile = profileResult.rows[0];

      // Insert MAC addresses if provided
      const macAddresses: any[] = [];
      if (input.mac_addresses && input.mac_addresses.length > 0) {
        for (const mac of input.mac_addresses) {
          const normalizedMac = normalizeMacAddress(mac);
          const macResult = await client.query(
            `INSERT INTO profile_mac_addresses (profile_id, mac_address)
             VALUES ($1, $2)
             RETURNING id, mac_address, created_at`,
            [profile.id, normalizedMac]
          );
          macAddresses.push(macResult.rows[0]);
        }
      }

      return {
        id: profile.id,
        name: profile.name,
        description: profile.description,
        mac_addresses: macAddresses.map((m) => ({
          id: m.id,
          address: m.mac_address,
          created_at: m.created_at,
        })),
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };
    });
  },

  async findById(id: string): Promise<Profile | null> {
    const row = await queryOne<any>(
      `SELECT p.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', maa.id,
                    'address', maa.mac_address,
                    'created_at', maa.created_at
                  ) ORDER BY maa.created_at
                ) FILTER (WHERE maa.id IS NOT NULL),
                '[]'
              ) as mac_addresses
       FROM profiles p
       LEFT JOIN profile_mac_addresses maa ON p.id = maa.profile_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );

    return row ? mapToProfile(row) : null;
  },

  async findByName(name: string): Promise<Profile | null> {
    const row = await queryOne<any>(
      `SELECT p.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', maa.id,
                    'address', maa.mac_address,
                    'created_at', maa.created_at
                  ) ORDER BY maa.created_at
                ) FILTER (WHERE maa.id IS NOT NULL),
                '[]'
              ) as mac_addresses
       FROM profiles p
       LEFT JOIN profile_mac_addresses maa ON p.id = maa.profile_id
       WHERE p.name = $1
       GROUP BY p.id`,
      [name]
    );

    return row ? mapToProfile(row) : null;
  },

  async findAll(): Promise<Profile[]> {
    const rows = await query<any>(
      `SELECT p.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', maa.id,
                    'address', maa.mac_address,
                    'created_at', maa.created_at
                  ) ORDER BY maa.created_at
                ) FILTER (WHERE maa.id IS NOT NULL),
                '[]'
              ) as mac_addresses
       FROM profiles p
       LEFT JOIN profile_mac_addresses maa ON p.id = maa.profile_id
       GROUP BY p.id
       ORDER BY p.name ASC`
    );

    return rows.map(mapToProfile);
  },

  async update(id: string, input: UpdateProfileInput): Promise<Profile | null> {
    return transaction(async (client) => {
      // Check if profile exists
      const existing = await client.query('SELECT id FROM profiles WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        return null;
      }

      // Validate MAC addresses if provided
      if (input.mac_addresses) {
        for (const mac of input.mac_addresses) {
          if (!isValidMacAddress(mac)) {
            throw new Error(`Invalid MAC address format: ${mac}`);
          }
        }
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(input.name);
      }

      if (input.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }

      if (updates.length > 0) {
        values.push(id);
        await client.query(
          `UPDATE profiles SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }

      // Update MAC addresses if provided
      if (input.mac_addresses !== undefined) {
        // Delete existing MAC addresses
        await client.query('DELETE FROM profile_mac_addresses WHERE profile_id = $1', [id]);

        // Insert new MAC addresses
        for (const mac of input.mac_addresses) {
          const normalizedMac = normalizeMacAddress(mac);
          await client.query(
            `INSERT INTO profile_mac_addresses (profile_id, mac_address)
             VALUES ($1, $2)`,
            [id, normalizedMac]
          );
        }
      }

      // Fetch and return updated profile using the transaction client
      const profileResult = await client.query(
        `SELECT p.*,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'id', maa.id,
                      'address', maa.mac_address,
                      'created_at', maa.created_at
                    ) ORDER BY maa.created_at
                  ) FILTER (WHERE maa.id IS NOT NULL),
                  '[]'
                ) as mac_addresses
         FROM profiles p
         LEFT JOIN profile_mac_addresses maa ON p.id = maa.profile_id
         WHERE p.id = $1
         GROUP BY p.id`,
        [id]
      );

      return mapToProfile(profileResult.rows[0]);
    });
  },

  async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM profiles WHERE id = $1 RETURNING id',
      [id]
    );
    return result.length > 0;
  },

  async exists(id: string): Promise<boolean> {
    const result = await queryOne<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM profiles WHERE id = $1) as exists',
      [id]
    );
    return result?.exists ?? false;
  },

  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    let sql = 'SELECT EXISTS(SELECT 1 FROM profiles WHERE name = $1';
    const params: any[] = [name];

    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }

    sql += ') as exists';

    const result = await queryOne<{ exists: boolean }>(sql, params);
    return result?.exists ?? false;
  },
};

// Re-export as default for convenience
export default PostgresProfileRepository;
