import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, size = 'md', className }) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8 text-xs'
      case 'lg':
        return 'h-16 w-16 text-lg'
      case 'xl':
        return 'h-20 w-20 text-xl'
      default:
        return 'h-12 w-12 text-sm'
    }
  }

  const getInitials = (text: string) => {
    if (!text) return ''
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
  }

  const getRandomColor = () => {
    const colors = [
      'bg-blue-50 dark:bg-blue-900/20',
      'bg-green-50 dark:bg-green-900/20',
      'bg-yellow-50 dark:bg-yellow-900/20',
      'bg-red-50 dark:bg-red-900/20',
      'bg-purple-50 dark:bg-purple-900/20',
      'bg-pink-500',
      'bg-indigo-50 dark:bg-indigo-900/20',
      'bg-gray-50 dark:bg-zinc-800/500',
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const showFallback = !src || imageError || !imageLoaded

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden',
        getSizeClasses(size),
        !showFallback && 'bg-gray-200',
        showFallback && getRandomColor(),
        className
      )}
    >
      {showFallback ? (
        <span className="font-medium text-white">{fallback ? getInitials(fallback) : '?'}</span>
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  )
}

export { Avatar }
