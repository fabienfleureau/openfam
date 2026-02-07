/**
 * Get Profile Use Case
 * Retrieves a single profile by ID
 */
import { PostgresProfileRepository } from '../../infrastructure/repositories/postgres-profile.repository';
import { ProfileNotFoundError } from '../errors/profile.errors';

export async function getProfileUseCase(id: string) {
  const profile = await PostgresProfileRepository.findById(id);

  if (!profile) {
    throw new ProfileNotFoundError(id);
  }

  return profile;
}
