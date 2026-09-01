'use client'

import { useState, useEffect } from 'react'
import { Scale } from 'lucide-react'

interface SiteLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

const sizeMap = {
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-lg' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xl' },
  lg: { container: 'w-14 h-14', icon: 'w-7 h-7', text: 'text-2xl' },
}

export default function SiteLogo({ size = 'md', className = '', showText = true }: SiteLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await fetch('/api/settings/logo', { cache: 'no-cache' })
        if (res.ok) {
          const data = await res.json()
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl)
          }
        }
      } catch {
        // Use fallback
      } finally {
        setLoading(false)
      }
    }
    loadLogo()
  }, [])

  const s = sizeMap[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${s.container} rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg flex-shrink-0`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : logoUrl ? (
          <img
            src={logoUrl}
            alt="JURISTIV Logo"
            className="w-full h-full object-contain p-1"
            onError={() => setLogoUrl(null)}
          />
        ) : (
          <Scale className={`${s.icon} text-white`} />
        )}
      </div>
      {showText && (
        <span className={`${s.text} font-bold text-gray-900 dark:text-white tracking-tight`}>
          JURIST<span className="text-indigo-500">IV</span>
        </span>
      )}
    </div>
  )
}
