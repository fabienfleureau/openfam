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
