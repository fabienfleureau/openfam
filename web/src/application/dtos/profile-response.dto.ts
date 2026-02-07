/**
 * Profile Response DTO
 * Data transfer object for profile API responses
 */

export interface MacAddressResponse {
  id: string;
  address: string;
  created_at: string;
}

export interface ProfileResponse {
  id: string;
  name: string;
  description: string | null;
  mac_addresses: MacAddressResponse[];
  created_at: string;
  updated_at: string;
}

/**
 * Convert domain entity to response DTO
 */
export function toProfileResponse(profile: any): ProfileResponse {
  return {
    id: profile.id,
    name: profile.name,
    description: profile.description,
    mac_addresses: profile.mac_addresses.map((m: any) => ({
      id: m.id,
      address: m.address,
      created_at: m.created_at instanceof Date ? m.created_at.toISOString() : m.created_at,
    })),
    created_at: profile.created_at instanceof Date ? profile.created_at.toISOString() : profile.created_at,
    updated_at: profile.updated_at instanceof Date ? profile.updated_at.toISOString() : profile.updated_at,
  };
}

/**
 * Convert list of domain entities to response DTOs
 */
export function toProfileResponseList(profiles: any[]): ProfileResponse[] {
  return profiles.map(toProfileResponse);
}
