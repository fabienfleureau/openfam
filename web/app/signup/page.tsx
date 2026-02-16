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
