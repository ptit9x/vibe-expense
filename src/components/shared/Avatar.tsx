import { useState } from 'react'
import { cn } from '@/lib/utils'

const SIZE_MAP = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-16 h-16 text-xl',
  lg: 'w-24 h-24 text-3xl',
} as const

const GRADIENTS = [
  'from-indigo-400 to-purple-500',
  'from-pink-400 to-rose-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-blue-500',
  'from-violet-400 to-fuchsia-500',
]

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

function getGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: keyof typeof SIZE_MAP
  className?: string
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const displayName = name || 'User'

  const showImage = src && !imgError

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden',
        SIZE_MAP[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={displayName}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={cn(
            'h-full w-full flex items-center justify-center bg-gradient-to-br text-white font-semibold select-none',
            getGradient(displayName),
          )}
        >
          {getInitial(displayName)}
        </div>
      )}
    </div>
  )
}
