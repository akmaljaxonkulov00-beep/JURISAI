import { uz } from './uz'
import { en } from './en'
import { ru } from './ru'

// Type definition for translations
export type TranslationKey = keyof typeof uz
export type Translations = typeof uz

// Available languages
export const languages = {
  uz: 'O‘zbekcha',
  en: 'English',
  ru: 'Русский',
} as const

export type Language = keyof typeof languages

// Translation objects with 100% parity
export const translations: Record<Language, Translations> = {
  uz,
  en,
  ru,
}

// Default language
export const defaultLanguage: Language = 'uz'

// Helper function to get translation
export function t(language: Language, key: TranslationKey | string, fallback?: string): string {
  const langObj = translations[language] || translations[defaultLanguage]
  const translation = (langObj as Record<string, string>)[key]
  if (translation) return translation
  if (translations[defaultLanguage]?.[key as TranslationKey]) {
    return translations[defaultLanguage][key as TranslationKey]
  }
  return fallback || key
}

// Hook for React components (if needed)
export function useTranslation(language: Language) {
  return {
    t: (key: TranslationKey | string, fallback?: string) => t(language, key, fallback),
    language,
  }
}
