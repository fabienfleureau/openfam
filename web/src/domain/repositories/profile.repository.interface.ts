/**
 * Profile Repository Interface
 * Defines the contract for profile data access
 */
import type { Profile, CreateProfileInput, UpdateProfileInput } from '../entities/profile.entity';

export interface ProfileRepository {
  /**
   * Create a new profile
   */
  create(input: CreateProfileInput): Promise<Profile>;

  /**
   * Find a profile by ID
   */
  findById(id: string): Promise<Profile | null>;

  /**
   * Find a profile by name
   */
  findByName(name: string): Promise<Profile | null>;

  /**
   * List all profiles
   */
  findAll(): Promise<Profile[]>;

  /**
   * Update an existing profile
   */
  update(id: string, input: UpdateProfileInput): Promise<Profile | null>;

  /**
   * Delete a profile by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if a profile exists by ID
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if a profile exists by name
   */
  nameExists(name: string, excludeId?: string): Promise<boolean>;
}
