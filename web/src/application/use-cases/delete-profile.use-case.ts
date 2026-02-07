/**
 * Delete Profile Use Case
 * Handles deleting a profile
 */
import { PostgresProfileRepository } from '../../infrastructure/repositories/postgres-profile.repository';
import { ProfileNotFoundError } from '../errors/profile.errors';

export async function deleteProfileUseCase(id: string) {
  // Check if profile exists
  const existing = await PostgresProfileRepository.findById(id);
  if (!existing) {
    throw new ProfileNotFoundError(id);
  }

  // Delete profile
  const deleted = await PostgresProfileRepository.delete(id);

  if (!deleted) {
    throw new ProfileNotFoundError(id);
  }

  return { success: true };
}
