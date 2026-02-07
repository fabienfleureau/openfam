/**
 * Update Profile DTO
 * Data transfer object for updating an existing profile
 */

export interface UpdateProfileDto {
  name?: string;
  description?: string | null;
  mac_addresses?: string[];
}

/**
 * Validate UpdateProfileDto
 */
export function validateUpdateProfileDto(dto: UpdateProfileDto): void {
  if (dto.name !== undefined) {
    if (dto.name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }

    if (dto.name.length > 255) {
      throw new Error('Name must be less than 255 characters');
    }
  }

  if (dto.description !== undefined && dto.description !== null && dto.description.length > 5000) {
    throw new Error('Description must be less than 5000 characters');
  }

  if (dto.mac_addresses) {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

    for (const mac of dto.mac_addresses) {
      if (!macRegex.test(mac)) {
        throw new Error(`Invalid MAC address format: ${mac}`);
      }
    }

    // Check for duplicates
    const normalized = dto.mac_addresses.map((m) => m.replace(/-/g, ':').toUpperCase());
    const unique = new Set(normalized);
    if (unique.size !== normalized.length) {
      throw new Error('Duplicate MAC addresses detected');
    }
  }
}
