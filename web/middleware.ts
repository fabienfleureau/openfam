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
