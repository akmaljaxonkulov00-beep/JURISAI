'use client'

import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'

interface SocialLink {
  platform: string
  url: string
  enabled: boolean
}

interface ContactSettings {
  contactSectionEnabled: boolean
  contactLabel: string
  contactHeading: string
  contactDescription: string
  socialLinks: SocialLink[]
}

const SOCIAL_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  telegram: {
    icon: 'M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13',
    color: '#229ED9',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
  },
  instagram: {
    icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
    color: '#E4405F',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
  },
  youtube: {
    icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    color: '#FF0000',
    bg: 'bg-red-50 dark:bg-red-950/30',
  },
  linkedin: {
    icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    color: '#0A66C2',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  website: {
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    color: '#6366F1',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
  },
}

const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  contactSectionEnabled: true,
  contactLabel: "Biz bilan bog'lanish",
  contactHeading: "JURISTIV hamjamiyatiga qo'shiling",
  contactDescription:
    "Eng so'nggi yangiliklar, platforma yangilanishlari, foydali huquqiy materiallar va e'lonlardan xabardor bo'lib boring.",
  socialLinks: [
    { platform: 'telegram', url: 'https://t.me/juristiv', enabled: true },
    { platform: 'instagram', url: 'https://instagram.com/juristiv', enabled: true },
  ],
}

export default function ContactSection() {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings/contact', { cache: 'no-cache' })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data) {
            const loaded = data.data as ContactSettings
            // Merge: use DB values but keep defaults for empty fields
            setSettings({
              contactSectionEnabled: loaded.contactSectionEnabled,
              contactLabel: loaded.contactLabel || DEFAULT_CONTACT_SETTINGS.contactLabel,
              contactHeading: loaded.contactHeading || DEFAULT_CONTACT_SETTINGS.contactHeading,
              contactDescription:
                loaded.contactDescription || DEFAULT_CONTACT_SETTINGS.contactDescription,
              socialLinks:
                loaded.socialLinks && loaded.socialLinks.length > 0
                  ? loaded.socialLinks
                  : DEFAULT_CONTACT_SETTINGS.socialLinks,
            })
          }
        }
      } catch {
        // Use defaults on error
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Don't render if loading or explicitly disabled by admin
  if (loading || !settings.contactSectionEnabled) {
    return null
  }

  // Always show — if no social links from DB, use defaults
  const socialLinksToShow =
    settings.socialLinks.length > 0 ? settings.socialLinks : DEFAULT_CONTACT_SETTINGS.socialLinks

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl p-8 sm:p-10 border border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Text */}
            <div>
              <span className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                {settings.contactLabel}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {settings.contactHeading}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {settings.contactDescription}
              </p>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
              {socialLinksToShow.map(link => {
                const social = SOCIAL_ICONS[link.platform]
                if (!social) return null

                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl ${social.bg} border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 group`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill={social.color}>
                      <path d={social.icon} />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {link.platform}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
