/**
 * Profile Domain Errors
 * Custom error classes for profile-related operations
 */

export class ProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileError';
  }
}

export class ProfileNotFoundError extends ProfileError {
  constructor(id: string) {
    super(`Profile with id "${id}" not found`);
    this.name = 'ProfileNotFoundError';
  }
}

export class ProfileAlreadyExistsError extends ProfileError {
  constructor(name: string) {
    super(`Profile with name "${name}" already exists`);
    this.name = 'ProfileAlreadyExistsError';
  }
}

export class InvalidMacAddressError extends ProfileError {
  constructor(mac: string) {
    super(`Invalid MAC address format: "${mac}". Expected format: AA:BB:CC:DD:EE:FF`);
    this.name = 'InvalidMacAddressError';
  }
}

export class ValidationError extends ProfileError {
  constructor(message: string) {
    super(`Validation error: ${message}`);
    this.name = 'ValidationError';
  }
}
