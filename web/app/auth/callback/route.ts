import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect') || '/profiles'

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if family profile exists, create if not
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: existingProfile } = await supabase
          .from('family_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (!existingProfile && user.user_metadata?.family_name) {
          // Create family profile from signup data
          await supabase.from('family_profiles').insert({
            user_id: user.id,
            family_name: user.user_metadata.family_name,
          })
        } else if (!existingProfile) {
          // Create default family profile
          await supabase.from('family_profiles').insert({
            user_id: user.id,
            family_name: 'My Family',
          })
        }
      }

      // Redirect to the intended page
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Error case - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
