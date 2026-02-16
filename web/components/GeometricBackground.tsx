export function GeometricBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950" />

      {/* Large lava blobs - warm colors */}
      <div className="absolute top-0 left-0 w-full h-full">
        {/* Red blob - large */}
        <div
          className="absolute w-[600px] h-[600px] bg-red-600/30 rounded-full blur-3xl animate-blob"
          style={{
            top: '10%',
            left: '10%',
            animationDelay: '0s',
          }}
        />

        {/* Orange blob - large */}
        <div
          className="absolute w-[700px] h-[700px] bg-orange-500/25 rounded-full blur-3xl animate-blob"
          style={{
            top: '30%',
            right: '10%',
            animationDelay: '2s',
          }}
        />

        {/* Pink blob - large */}
        <div
          className="absolute w-[500px] h-[500px] bg-pink-600/30 rounded-full blur-3xl animate-blob"
          style={{
            bottom: '10%',
            left: '20%',
            animationDelay: '4s',
          }}
        />

        {/* Purple blob - large */}
        <div
          className="absolute w-[650px] h-[650px] bg-purple-600/25 rounded-full blur-3xl animate-blob"
          style={{
            bottom: '20%',
            right: '15%',
            animationDelay: '1s',
          }}
        />

        {/* Yellow blob - medium */}
        <div
          className="absolute w-[400px] h-[400px] bg-yellow-500/20 rounded-full blur-3xl animate-blob"
          style={{
            top: '40%',
            left: '40%',
            animationDelay: '3s',
          }}
        />

        {/* Magenta blob - medium */}
        <div
          className="absolute w-[450px] h-[450px] bg-fuchsia-600/25 rounded-full blur-3xl animate-blob"
          style={{
            top: '15%',
            right: '30%',
            animationDelay: '5s',
          }}
        />
      </div>

      {/* Small floating blobs for extra detail */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`small-blob-${i}`}
          className="absolute rounded-full blur-2xl animate-float"
          style={{
            width: `${100 + Math.random() * 150}px`,
            height: `${100 + Math.random() * 150}px`,
            top: `${Math.random() * 80}%`,
            left: `${Math.random() * 80}%`,
            background: `rgba(${200 + Math.random() * 55}, ${50 + Math.random() * 100}, ${100 + Math.random() * 100}, ${0.1 + Math.random() * 0.15})`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${6 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  )
}
