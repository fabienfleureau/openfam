/**
 * Profile Entity
 * Represents a user profile in the domain layer
 */
export interface MacAddress {
  id: string;
  address: string;
  created_at: Date;
}

export interface Profile {
  id: string;
  name: string;
  description: string | null;
  mac_addresses: MacAddress[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Value object for creating a new profile
 */
export interface CreateProfileInput {
  name: string;
  description?: string;
  mac_addresses?: string[];
}

/**
 * Value object for updating a profile
 */
export interface UpdateProfileInput {
  name?: string;
  description?: string | null;
  mac_addresses?: string[];
}
