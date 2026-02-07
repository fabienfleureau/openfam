/**
 * Profile API Routes (by ID)
 * GET /api/profiles/[id] - Get a single profile
 * PUT /api/profiles/[id] - Update a profile
 * DELETE /api/profiles/[id] - Delete a profile
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProfileUseCase } from '@/application/use-cases/get-profile.use-case';
import { updateProfileUseCase } from '@/application/use-cases/update-profile.use-case';
import { deleteProfileUseCase } from '@/application/use-cases/delete-profile.use-case';
import { toProfileResponse } from '@/application/dtos/profile-response.dto';
import { ProfileNotFoundError, ProfileAlreadyExistsError } from '@/application/errors/profile.errors';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/profiles/[id]
 * Get a single profile by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const profile = await getProfileUseCase(id);
    return NextResponse.json(toProfileResponse(profile));
  } catch (error) {
    console.error('Error getting profile:', error);

    if (error instanceof ProfileNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profiles/[id]
 * Update a profile
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const profile = await updateProfileUseCase(id, body);
    return NextResponse.json(toProfileResponse(profile));
  } catch (error) {
    console.error('Error updating profile:', error);

    if (error instanceof ProfileNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

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
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profiles/[id]
 * Delete a profile
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteProfileUseCase(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting profile:', error);

    if (error instanceof ProfileNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
}
