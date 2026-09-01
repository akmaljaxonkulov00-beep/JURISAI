'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Save, Globe, MessageCircle, PlayCircle, Link2, ExternalLink } from 'lucide-react'

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

const DEFAULT_SETTINGS: ContactSettings = {
  contactSectionEnabled: true,
  contactLabel: "Biz bilan bog'lanish",
  contactHeading: "JURISTIV hamjamiyatiga qo'shiling",
  contactDescription:
    "Eng so'nggi yangiliklar, platforma yangilanishlari, foydali huquqiy materiallar va e'lonlardan xabardor bo'lib boring.",
  socialLinks: [
    { platform: 'telegram', url: '', enabled: false },
    { platform: 'instagram', url: '', enabled: false },
    { platform: 'youtube', url: '', enabled: false },
    { platform: 'linkedin', url: '', enabled: false },
    { platform: 'website', url: '', enabled: false },
  ],
}

const PLATFORM_LABELS: Record<string, { label: string; icon: typeof Globe }> = {
  telegram: { label: 'Telegram', icon: MessageCircle },
  instagram: { label: 'Instagram', icon: Globe },
  youtube: { label: 'YouTube', icon: PlayCircle },
  linkedin: { label: 'LinkedIn', icon: Link2 },
  website: { label: 'Website', icon: ExternalLink },
}

export default function ContactSettingsCard() {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings/contact', { cache: 'no-cache' })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data) {
            // Merge with defaults to ensure all platforms exist
            const loaded = data.data as ContactSettings
            const mergedLinks = DEFAULT_SETTINGS.socialLinks.map(defaultLink => {
              const found = loaded.socialLinks?.find(
                (l: SocialLink) => l.platform === defaultLink.platform
              )
              return found || defaultLink
            })
            setSettings({ ...loaded, socialLinks: mergedLinks })
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const updateSocialLink = (platform: string, field: keyof SocialLink, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map(link =>
        link.platform === platform ? { ...link, [field]: value } : link
      ),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/settings/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // Error
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="card-default rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-default rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
          <Globe className="w-5 h-5 text-blue-500" />
          Kontakt va ijtimoiy tarmoqlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Enable/disable toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Landing section</p>
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              Contact sectionni landing page'da ko'rsatish
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setSettings(prev => ({
                ...prev,
                contactSectionEnabled: !prev.contactSectionEnabled,
              }))
            }
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              settings.contactSectionEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                settings.contactSectionEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Text fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
            Label (kichik yozuv)
          </label>
          <Input
            value={settings.contactLabel}
            onChange={e => setSettings(prev => ({ ...prev, contactLabel: e.target.value }))}
            placeholder="Biz bilan bog'lanish"
            className="w-full text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
            Sarlavha
          </label>
          <Input
            value={settings.contactHeading}
            onChange={e => setSettings(prev => ({ ...prev, contactHeading: e.target.value }))}
            placeholder="JURISTIV hamjamiyatiga qo'shiling"
            className="w-full text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
            Tavsif
          </label>
          <textarea
            value={settings.contactDescription}
            onChange={e => setSettings(prev => ({ ...prev, contactDescription: e.target.value }))}
            placeholder="Eng so'nggi yangiliklar..."
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white resize-none text-sm"
            rows={3}
          />
        </div>

        {/* Social links */}
        <div className="border-t border-gray-100 dark:border-zinc-800 pt-5">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-4">
            Ijtimoiy tarmoqlar
          </h4>
          <div className="space-y-3">
            {settings.socialLinks.map(link => {
              const platform = PLATFORM_LABELS[link.platform]
              if (!platform) return null
              const Icon = platform.icon

              return (
                <div
                  key={link.platform}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50"
                >
                  <Icon className="w-4 h-4 text-gray-500 dark:text-zinc-400 flex-shrink-0" />
                  <div className="flex-1">
                    <Input
                      value={link.url}
                      onChange={e => updateSocialLink(link.platform, 'url', e.target.value)}
                      placeholder={`${platform.label} URL`}
                      className="w-full text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSocialLink(link.platform, 'enabled', !link.enabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                      link.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                        link.enabled ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
          {saved && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Kontakt sozlamalari saqlandi! ✅
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
