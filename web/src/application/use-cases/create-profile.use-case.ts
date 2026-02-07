/**
 * Create Profile Use Case
 * Handles the creation of a new profile
 */
import { PostgresProfileRepository } from '../../infrastructure/repositories/postgres-profile.repository';
import type { CreateProfileDto } from '../dtos/create-profile.dto';
import { validateCreateProfileDto } from '../dtos/create-profile.dto';
import { ProfileAlreadyExistsError } from '../errors/profile.errors';

export async function createProfileUseCase(dto: CreateProfileDto) {
  // Validate input
  validateCreateProfileDto(dto);

  // Check if profile with the same name already exists
  const existing = await PostgresProfileRepository.findByName(dto.name);
  if (existing) {
    throw new ProfileAlreadyExistsError(dto.name);
  }

  // Create profile
  const profile = await PostgresProfileRepository.create({
    name: dto.name,
    description: dto.description,
    mac_addresses: dto.mac_addresses,
  });

  return profile;
}
