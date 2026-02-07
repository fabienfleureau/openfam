/**
 * Update Profile Use Case
 * Handles updating an existing profile
 */
import { PostgresProfileRepository } from '../../infrastructure/repositories/postgres-profile.repository';
import type { UpdateProfileDto } from '../dtos/update-profile.dto';
import { validateUpdateProfileDto } from '../dtos/update-profile.dto';
import { ProfileNotFoundError, ProfileAlreadyExistsError } from '../errors/profile.errors';

export async function updateProfileUseCase(id: string, dto: UpdateProfileDto) {
  // Validate input
  validateUpdateProfileDto(dto);

  // Check if profile exists
  const existing = await PostgresProfileRepository.findById(id);
  if (!existing) {
    throw new ProfileNotFoundError(id);
  }

  // Check if name is being changed and if new name already exists
  if (dto.name && dto.name !== existing.name) {
    const nameExists = await PostgresProfileRepository.findByName(dto.name);
    if (nameExists) {
      throw new ProfileAlreadyExistsError(dto.name);
    }
  }

  // Update profile
  const updated = await PostgresProfileRepository.update(id, {
    name: dto.name,
    description: dto.description,
    mac_addresses: dto.mac_addresses,
  });

  return updated;
}
