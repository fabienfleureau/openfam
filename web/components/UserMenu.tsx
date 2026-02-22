'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function UserMenu() {
  const [familyName, setFamilyName] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const loadFamilyName = useCallback(async () => {
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
  }, [supabase])

  useEffect(() => {
    loadFamilyName()
  }, [loadFamilyName])

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
