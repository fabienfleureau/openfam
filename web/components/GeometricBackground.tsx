'use client'

// Generate blob data once at module level - never regenerates
const SMALL_BLOBS = [...Array(8)].map((_, i) => ({
  id: i,
  width: 100 + Math.random() * 150,
  height: 100 + Math.random() * 150,
  top: Math.random() * 80,
  left: Math.random() * 80,
  background: `rgba(${200 + Math.random() * 55}, ${50 + Math.random() * 100}, ${100 + Math.random() * 100}, ${0.1 + Math.random() * 0.15})`,
  animationDelay: Math.random() * 6,
  animationDuration: 6 + Math.random() * 4,
}))

export function GeometricBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950" />

      {/* Large lava blobs - warm colors */}
      <div className="absolute top-0 left-0 w-full h-full">
        {/* Red blob - large - rises from bottom-left */}
        <div
          className="absolute w-[600px] h-[600px] bg-red-600/30 rounded-full blur-3xl animate-lava-rise"
          style={{
            bottom: '-50px',
            left: '5%',
            animationDelay: '0s',
            animationDuration: '16s',
          }}
        />

        {/* Orange blob - large - rises from bottom-right */}
        <div
          className="absolute w-[700px] h-[700px] bg-orange-500/25 rounded-full blur-3xl animate-lava-rise"
          style={{
            bottom: '-50px',
            right: '5%',
            animationDelay: '5s',
            animationDuration: '18s',
          }}
        />

        {/* Pink blob - large - falls from top */}
        <div
          className="absolute w-[500px] h-[500px] bg-pink-600/30 rounded-full blur-3xl animate-lava-fall"
          style={{
            top: '-50px',
            left: '25%',
            animationDelay: '3s',
            animationDuration: '20s',
          }}
        />

        {/* Purple blob - large - falls from top-right */}
        <div
          className="absolute w-[650px] h-[650px] bg-purple-600/25 rounded-full blur-3xl animate-lava-fall"
          style={{
            top: '-50px',
            right: '20%',
            animationDelay: '1s',
            animationDuration: '17s',
          }}
        />

        {/* Yellow blob - medium - rises from bottom-center */}
        <div
          className="absolute w-[400px] h-[400px] bg-yellow-500/20 rounded-full blur-3xl animate-lava-rise"
          style={{
            bottom: '-50px',
            left: '45%',
            animationDelay: '8s',
            animationDuration: '14s',
          }}
        />

        {/* Magenta blob - medium - falls from top-center */}
        <div
          className="absolute w-[450px] h-[450px] bg-fuchsia-600/25 rounded-full blur-3xl animate-lava-fall"
          style={{
            top: '-50px',
            right: '35%',
            animationDelay: '6s',
            animationDuration: '19s',
          }}
        />
      </div>

      {/* Small floating blobs for extra detail */}
      {SMALL_BLOBS.map((blob) => (
        <div
          key={blob.id}
          className="absolute rounded-full blur-2xl animate-float"
          style={{
            width: `${blob.width}px`,
            height: `${blob.height}px`,
            top: `${blob.top}%`,
            left: `${blob.left}%`,
            background: blob.background,
            animationDelay: `${blob.animationDelay}s`,
            animationDuration: `${blob.animationDuration}s`,
          }}
        />
      ))}
    </div>
  )
}
