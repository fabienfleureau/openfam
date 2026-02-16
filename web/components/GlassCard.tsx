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
