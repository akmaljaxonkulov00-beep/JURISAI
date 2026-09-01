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
  const [logoDarkUrl, setLogoDarkUrl] = useState<string | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Detect dark mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', handler)

    // Also check for dark class on html (for manual theme toggle)
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark')
      setIsDark(dark)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      mq.removeEventListener('change', handler)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const res = await fetch('/api/settings/logo', { cache: 'no-cache' })
        if (res.ok) {
          const data = await res.json()
          if (data.logoUrl) setLogoUrl(data.logoUrl)
          if (data.logoDarkUrl) setLogoDarkUrl(data.logoDarkUrl)
          if (data.faviconUrl) setFaviconUrl(data.faviconUrl)
        }
      } catch {
        // Use fallback
      } finally {
        setLoading(false)
      }
    }
    loadLogo()
  }, [])

  // Inject favicon into <head>
  useEffect(() => {
    if (!faviconUrl) return

    // Remove old dynamic favicon
    const old = document.getElementById('dynamic-favicon')
    if (old) old.remove()

    const link = document.createElement('link')
    link.id = 'dynamic-favicon'
    link.rel = 'icon'
    link.type = faviconUrl.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png'
    link.href = faviconUrl
    document.head.appendChild(link)
  }, [faviconUrl])

  // Pick correct logo for current theme
  const activeLogo = isDark ? logoDarkUrl || logoUrl : logoUrl

  const s = sizeMap[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${s.container} rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg flex-shrink-0`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : activeLogo ? (
          <img
            src={activeLogo}
            alt="JURISTIV Logo"
            className="w-full h-full object-contain p-1"
            onError={() => {
              // Fallback to icon
              setLogoUrl(null)
              setLogoDarkUrl(null)
            }}
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
