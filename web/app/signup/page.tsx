'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
            <p className="text-white/40 text-sm">Start protecting your family&apos;s digital life</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] ml-1">
                Family Name
              </label>
              <input
                type="text"
                placeholder="e.g. Smith Family"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint/30 transition-all"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] ml-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint/30 transition-all"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !familyName}
              className="btn-primary w-full py-3.5"
            >
              {loading ? 'Creating Account...' : 'Create Family Account'}
            </button>
          </form>

          {message && (
            <p className={`mt-6 text-center text-sm font-medium ${message.includes('Error') ? 'text-critical' : 'text-mint'}`}>
              {message}
            </p>
          )}

          <div className="mt-10 text-center border-t border-white/5 pt-8">
            <p className="text-white/30 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-white hover:text-mint transition-colors font-medium underline underline-offset-4 decoration-white/10 hover:decoration-mint/30">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
