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
  announcementBanner: 'JURISAI - Huquqiy AI yordamchingiz!',
  heroTitle: 'Huquqiy masalalarni AI bilan yeching',
  heroSubtitle: "O'zbekiston qonunchiligi bo'yicha professional AI yordamchi",
  contactEmail: 'support@jurisai.uz',
  contactPhone: '+998 90 123 45 67',
  telegramLink: 'https://t.me/jurisai_bot',
  legalDisclaimer:
    "JURISAI tomonidan berilgan ma'lumotlar faqat ma'lumot uchun. Rasmiy huquqiy maslahat o'rnini bosa olmaydi.",
  systemPrompt: 'You are JurisAI — an expert legal consultant...',
  paymentCardNumber: '8600 1234 5678 9012',
  paymentDetails: 'Click: *123# 45000 UZS / Payme: 8600 1234 5678 9012',
}

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    // Read from the public key that admin writes to
    try {
      const stored = localStorage.getItem('siteSettings')
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch {}
  }, [])

  return settings
}

// Helper to get individual setting values in components
export function getSetting(key: keyof SiteSettings): string {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS[key] || ''
  try {
    const stored = localStorage.getItem('siteSettings')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed[key] || DEFAULT_SETTINGS[key] || ''
    }
  } catch {}
  return DEFAULT_SETTINGS[key] || ''
}
