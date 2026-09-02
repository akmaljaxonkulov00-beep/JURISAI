'use client'

import { useState, useEffect } from 'react'

export interface SiteSettings {
  announcementBanner: string
  heroTitle: string
  heroSubtitle: string
  contactEmail: string
  contactPhone: string
  telegramLink: string
  legalDisclaimer: string
  systemPrompt: string
  paymentCardNumber: string
  paymentDetails: string
}

const DEFAULT_SETTINGS: SiteSettings = {
  announcementBanner: 'JURISTIV - Huquqiy AI yordamchingiz!',
  heroTitle: 'Huquqiy masalalarni AI bilan yeching',
  heroSubtitle: "O'zbekiston qonunchiligi bo'yicha professional AI yordamchi",
  contactEmail: 'support@juristiv.uz',
  contactPhone: '+998 90 123 45 67',
  telegramLink: 'https://t.me/juristiv_bot',
  legalDisclaimer:
    "JURISTIV tomonidan berilgan ma'lumotlar faqat ma'lumot uchun. Rasmiy huquqiy maslahat o'rnini bosa olmaydi.",
  systemPrompt: 'You are Juristiv — an expert legal consultant...',
  paymentCardNumber: '8600 1234 5678 9012',
  paymentDetails: 'Click: *123# 45000 UZS / Payme: 8600 1234 5678 9012',
}

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings/public', { cache: 'no-cache' })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data) {
            setSettings({ ...DEFAULT_SETTINGS, ...data.data })
          }
        }
      } catch {
        // Use defaults — no localStorage fallback to prevent stale data
      }
    }
    loadSettings()
  }, [])

  return settings
}

// Helper to get individual setting values in components
export function getSetting(key: keyof SiteSettings): string {
  // NOTE: This is a synchronous helper that only returns defaults.
  // Components should use the useSiteSettings hook for DB-backed values.
  return DEFAULT_SETTINGS[key] || ''
}
