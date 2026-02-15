# Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Supabase magic-link authentication to OpenFAM web dashboard with Glassmorphism UI design

**Architecture:** Supabase Auth for user management and magic links, Next.js middleware for route protection, RLS policies for data isolation

**Tech Stack:** Next.js 15 (App Router), Supabase SSR, TypeScript, Tailwind CSS

---

## Task 1: Install Supabase Dependencies

**Files:**
- Modify: `web/package.json`

**Step 1: Install Supabase packages**

Run: `cd web && npm install @supabase/ssr @supabase/supabase-js`

Expected: Packages added to package.json and node_modules

**Step 2: Add Supabase environment variables**

Create: `web/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Step 3: Commit**

```bash
cd /Users/ffleureau/workspace/perso/parentalcontrol/openfam
git add web/package.json web/.env.local
git commit -m "feat(web): install Supabase dependencies"
```

---

## Task 2: Create Supabase Client Utilities

**Files:**
- Create: `web/lib/supabase/server.ts`
- Create: `web/lib/supabase/client.ts`
- Create: `web/lib/supabase/middleware.ts`

**Step 1: Create server-side Supabase client**

Create: `web/lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

**Step 2: Create client-side Supabase client**

Create: `web/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 3: Create middleware Supabase client**

Create: `web/lib/supabase/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
```

**Step 4: Commit**

```bash
git add web/lib/supabase/
git commit -m "feat(web): create Supabase client utilities"
```

---

## Task 3: Create Database Migration for Family Profiles

**Files:**
- Create: `web/lib/migrations/002_create_family_profiles_table.sql`

**Step 1: Create migration file**

Create: `web/lib/migrations/002_create_family_profiles_table.sql`

```sql
-- Family profiles table - links Supabase auth users to family data
CREATE TABLE IF NOT EXISTS public.family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own family_profile" ON public.family_profiles;
DROP POLICY IF EXISTS "Users can create own family_profile" ON public.family_profiles;
DROP POLICY IF EXISTS "Users can update own family_profile" ON public.family_profiles;

-- Policy: Users can only read their own family profile
CREATE POLICY "Users can view own family_profile"
  ON public.family_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own family profile
CREATE POLICY "Users can create own family_profile"
  ON public.family_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own family profile
CREATE POLICY "Users can update own family_profile"
  ON public.family_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_family_profiles_user_id ON public.family_profiles(user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.family_profiles TO authenticated;
```

**Step 2: Run migration**

Run: `cd web && npx tsx lib/migrations.ts`

Expected: Migration executes successfully, table created

**Step 3: Commit**

```bash
git add web/lib/migrations/002_create_family_profiles_table.sql
git commit -m "feat(web): create family_profiles table with RLS policies"
```

---

## Task 4: Create Middleware for Route Protection

**Files:**
- Create: `web/middleware.ts`

**Step 1: Create middleware file**

Create: `web/middleware.ts`

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { NextResponse } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = ['/profiles', '/devices', '/settings']
// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/auth/callback']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip middleware for static files, api routes that handle their own auth
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isPublicRoute = publicRoutes.includes(path)

  // If accessing protected route without auth, redirect to login
  if (isProtectedRoute && !user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // If accessing login/signup while already authenticated, redirect to profiles
  if ((path === '/login' || path === '/signup') && user) {
    return NextResponse.redirect(new URL('/profiles', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico.*).*)',
  ],
}
```

**Step 2: Commit**

```bash
git add web/middleware.ts
git commit -m "feat(web): add middleware for route protection"
```

---

## Task 5: Create Geometric Background Component

**Files:**
- Create: `web/components/GeometricBackground.tsx`

**Step 1: Create background component**

Create: `web/components/GeometricBackground.tsx`

```typescript
export function GeometricBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900 animate-gradient-shift" />

      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />

      {/* Geometric forms */}
      <div className="absolute top-1/4 right-1/4 w-32 h-32 border border-white/10 rotate-45 animate-float" />
      <div className="absolute bottom-1/3 left-1/4 w-24 h-24 border border-white/10 rounded-full animate-float animation-delay-2000" />
      <div className="absolute top-2/3 right-1/3 w-16 h-16 bg-white/5 rotate-12 animate-float animation-delay-4000" />
    </div>
  )
}
```

**Step 2: Add Tailwind animations**

Modify: `web/tailwind.config.ts` - add to `theme.extend`

```typescript
animation: {
  'gradient-shift': 'gradient-shift 15s ease infinite',
  'blob': 'blob 7s infinite',
  'float': 'float 6s ease-in-out infinite',
},
keyframes: {
  'gradient-shift': {
    '0%, 100%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
  },
  'blob': {
    '0%': { transform: 'translate(0px, 0px) scale(1)' },
    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
    '100%': { transform: 'translate(0px, 0px) scale(1)' },
  },
  'float': {
    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
    '50%': { transform: 'translateY(-20px) rotate(5deg)' },
  },
},
```

**Step 3: Add animation delay utilities**

```typescript
animationDelay: {
  '2000': '2s',
  '4000': '4s',
}
```

**Step 4: Commit**

```bash
git add web/components/GeometricBackground.tsx web/tailwind.config.ts
git commit -m "feat(web): add geometric background component with animations"
```

---

## Task 6: Create Glassmorphism Card Component

**Files:**
- Create: `web/components/GlassCard.tsx`

**Step 1: Create glass card component**

Create: `web/components/GlassCard.tsx`

```typescript
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`
      backdrop-blur-xl
      bg-white/10
      border border-white/20
      shadow-2xl
      rounded-2xl
      p-8
      ${className}
    `}>
      {children}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add web/components/GlassCard.tsx
git commit -m "feat(web): add Glassmorphism card component"
```

---

## Task 7: Create Login Page

**Files:**
- Create: `web/app/login/page.tsx`

**Step 1: Create login page**

Create: `web/app/login/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { GeometricBackground } from '@/components/GeometricBackground'
import { GlassCard } from '@/components/GlassCard'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/profiles'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) {
        setMessage('Error sending magic link. Please try again.')
        console.error('Login error:', error)
      } else {
        setMessage('Check your email for the magic link!')
      }
    } catch (err) {
      setMessage('An unexpected error occurred.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GeometricBackground />

      <div className="w-full max-w-md">
        <GlassCard>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">OpenFAM</h1>
            <p className="text-white/80">Smart Heart of Your Family Network</p>
          </div>

          <h2 className="text-xl text-white mb-6">Sign in with Magic Link</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-4 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>

          {message && (
            <p className={`mt-4 text-center text-sm ${message.includes('Error') ? 'text-red-300' : 'text-green-300'}`}>
              {message}
            </p>
          )}

          <div className="mt-6 text-center text-white/70 text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-white hover:underline">
              Sign up
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add web/app/login/page.tsx
git commit -m "feat(web): create login page with magic link"
```

---

## Task 8: Create Signup Page

**Files:**
- Create: `web/app/signup/page.tsx`

**Step 1: Create signup page**

Create: `web/app/signup/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GeometricBackground } from '@/components/GeometricBackground'
import { GlassCard } from '@/components/GlassCard'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()

      // Step 1: Create user with magic link (sends email)
      const { data: { user }, error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            family_name: familyName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (otpError) {
        setMessage('Error creating account. Please try again.')
        console.error('Signup error:', otpError)
        setLoading(false)
        return
      }

      // Step 2: Create family profile (will be created in callback after user confirms)
      // Store family name temporarily in localStorage for callback
      localStorage.setItem('pending_family_name', familyName)

      setMessage('Check your email to complete your account setup!')
    } catch (err) {
      setMessage('An unexpected error occurred.')
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GeometricBackground />

      <div className="w-full max-w-md">
        <GlassCard>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">OpenFAM</h1>
            <p className="text-white/80">Smart Heart of Your Family Network</p>
          </div>

          <h2 className="text-xl text-white mb-6">Create Your Family Account</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Family Name (e.g., Smith Family)"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                disabled={loading}
              />
            </div>

            <div>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !familyName}
              className="w-full py-3 px-4 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {message && (
            <p className={`mt-4 text-center text-sm ${message.includes('Error') ? 'text-red-300' : 'text-green-300'}`}>
              {message}
            </p>
          )}

          <div className="mt-6 text-center text-white/70 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:underline">
              Sign in
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add web/app/signup/page.tsx
git commit -m "feat(web): create signup page with family name"
```

---

## Task 9: Create Auth Callback Handler

**Files:**
- Create: `web/app/auth/callback/route.ts`

**Step 1: Create callback route**

Create: `web/app/auth/callback/route.ts`

```typescript
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
```

**Step 2: Commit**

```bash
git add web/app/auth/callback/route.ts
git commit -m "feat(web): create auth callback handler"
```

---

## Task 10: Update Landing Page with Demo Preview

**Files:**
- Modify: `web/app/page.tsx`

**Step 1: Update landing page**

Current file: Read existing `web/app/page.tsx` and replace with:

```typescript
import Link from 'next/link'
import { GeometricBackground } from '@/components/GeometricBackground'
import { GlassCard } from '@/components/GlassCard'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <GeometricBackground />

      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-white">OpenFAM</h1>
          <p className="text-2xl text-white/80">Smart Heart of Your Family Network</p>

          <div className="flex gap-4 justify-center pt-4">
            <Link href="/login">
              <button className="px-8 py-3 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition-colors border border-white/20">
                Sign In
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-8 py-3 rounded-lg bg-white text-purple-900 font-medium hover:bg-white/90 transition-colors">
                Sign Up
              </button>
            </Link>
          </div>
        </div>

        {/* Demo Preview Card */}
        <GlassCard className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Demo: Family Dashboard</h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Stats */}
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-3xl font-bold text-white">12</div>
              <div className="text-white/70">Connected Devices</div>
            </div>

            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-4xl mb-2">📱</div>
              <div className="text-3xl font-bold text-white">3</div>
              <div className="text-white/70">Profiles</div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">Network Status: Healthy</span>
          </div>

          {/* Profile Preview */}
          <div className="mt-4 space-y-2">
            <div className="text-white/70 text-sm">Profiles:</div>
            {['Emma - Homework Mode', 'Leo - Bedtime', 'Sophie - Online'].map((profile, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-white/5 rounded">
                <span className="text-2xl">👤</span>
                <span className="text-white/80">{profile}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Features */}
        <GlassCard>
          <h3 className="text-xl font-bold text-white mb-4">Features</h3>
          <ul className="space-y-2 text-white/80">
            <li>• Profile-based internet filtering</li>
            <li>• Time-based schedules (homework, bedtime)</li>
            <li>• Bonus time request system</li>
            <li>• Real-time device monitoring</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add web/app/page.tsx
git commit -m "feat(web): update landing page with demo preview"
```

---

## Task 11: Create UserMenu Component

**Files:**
- Create: `web/components/UserMenu.tsx`

**Step 1: Create user menu component**

Create: `web/components/UserMenu.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function UserMenu() {
  const [familyName, setFamilyName] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadFamilyName()
  }, [])

  const loadFamilyName = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('family_profiles')
        .select('family_name')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setFamilyName(profile.family_name)
      }
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!familyName) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <span>🏠</span>
        <span>{familyName}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl z-50">
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  router.push('/settings')
                  setIsOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded transition-colors"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded transition-colors"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add web/components/UserMenu.tsx
git commit -m "feat(web): add UserMenu dropdown component"
```

---

## Task 12: Update Root Layout with UserMenu

**Files:**
- Modify: `web/app/layout.tsx`

**Step 1: Add UserMenu to layout**

Read current `web/app/layout.tsx` and add UserMenu to header. The exact modification depends on current layout structure. Add after the logo/title in the header:

```typescript
import { UserMenu } from '@/components/UserMenu'
```

And include `<UserMenu />` in the header navigation.

**Step 2: Commit**

```bash
git add web/app/layout.tsx
git commit -m "feat(web): add UserMenu to header"
```

---

## Task 13: Protect API Routes

**Files:**
- Modify: `web/app/api/profiles/route.ts`
- Modify: `web/app/api/profiles/[id]/route.ts` (if exists)
- Modify: `web/app/api/devices/route.ts` (if exists)

**Step 1: Add auth check to profiles API**

For each API route, add this pattern at the start:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Add at the start of GET, POST, PUT, DELETE handlers:
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ... rest of your handler
}
```

**Step 2: Commit**

```bash
git add web/app/api/
git commit -m "feat(web): add authentication to API routes"
```

---

## Task 14: Add Sign Out API Route

**Files:**
- Create: `web/app/api/auth/signout/route.ts`

**Step 1: Create signout route**

Create: `web/app/api/auth/signout/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
```

**Step 2: Commit**

```bash
git add web/app/api/auth/signout/route.ts
git commit -m "feat(web): add signout API route"
```

---

## Task 15: Testing

**Files:**
- No files created - manual testing

**Step 1: Start dev server**

Run: `cd web && npm run dev`

Expected: Server starts on http://localhost:3000

**Step 2: Test landing page**

1. Visit http://localhost:3000
2. Verify: Glassmorphism design visible
3. Verify: Geometric background animating
4. Verify: Demo preview card shows
5. Verify: Sign In and Sign Up buttons work

**Step 3: Test signup flow**

1. Click "Sign Up"
2. Fill in family name and email
3. Click "Create Account"
4. Verify: Success message appears
5. Check email for magic link (may need to configure Supabase email settings)

**Step 4: Test login flow**

1. Click "Sign In"
2. Enter email
3. Click "Send Magic Link"
4. Verify: Success message appears

**Step 5: Test protected routes**

1. Visit http://localhost:3000/profiles (while logged out)
2. Verify: Redirect to /login
3. Login via magic link
4. Verify: Redirect to /profiles
5. Verify: UserMenu shows family name

**Step 6: Test sign out**

1. Click UserMenu dropdown
2. Click "Sign Out"
3. Verify: Redirect to home page
4. Visit /profiles again
5. Verify: Redirect to /login

---

## Completion Checklist

- [ ] All dependencies installed
- [ ] Supabase client utilities created
- [ ] Database migration run successfully
- [ ] Middleware protecting routes
- [ ] Login page with Glassmorphism design
- [ ] Signup page with family name
- [ ] Auth callback working
- [ ] Landing page with demo preview
- [ ] UserMenu in header
- [ ] API routes protected
- [ ] All flows tested end-to-end

---

## Notes

- You'll need a Supabase project with Auth enabled
- Configure email templates in Supabase dashboard for magic links
- For local testing, you may need to use Supabase's email preview feature
- The `family_profiles` table links to `auth.users` via `user_id`
- RLS policies ensure users can only access their own data
