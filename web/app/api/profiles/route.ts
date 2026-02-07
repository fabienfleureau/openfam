/**
 * Profiles API Routes
 * GET /api/profiles - List all profiles
 * POST /api/profiles - Create a new profile
 */
import { NextRequest, NextResponse } from 'next/server';
import { listProfilesUseCase } from '@/application/use-cases/list-profiles.use-case';
import { createProfileUseCase } from '@/application/use-cases/create-profile.use-case';
import { toProfileResponseList, toProfileResponse } from '@/application/dtos/profile-response.dto';
import { ProfileAlreadyExistsError } from '@/application/errors/profile.errors';

/**
 * GET /api/profiles
 * List all profiles
 */
export async function GET() {
  try {
    const profiles = await listProfilesUseCase();
    return NextResponse.json(toProfileResponseList(profiles));
  } catch (error) {
    console.error('Error listing profiles:', error);
    return NextResponse.json(
      { error: 'Failed to list profiles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profiles
 * Create a new profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const profile = await createProfileUseCase(body);
    return NextResponse.json(toProfileResponse(profile), { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);

    if (error instanceof ProfileAlreadyExistsError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}
