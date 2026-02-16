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
