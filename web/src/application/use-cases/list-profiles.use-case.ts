/**
 * List Profiles Use Case
 * Retrieves all profiles
 */
import { PostgresProfileRepository } from '../../infrastructure/repositories/postgres-profile.repository';

export async function listProfilesUseCase() {
  const profiles = await PostgresProfileRepository.findAll();
  return profiles;
}
