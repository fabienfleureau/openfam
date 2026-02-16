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
