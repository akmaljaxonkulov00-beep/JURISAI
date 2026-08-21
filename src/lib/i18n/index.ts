import { uz } from './uz'
import { en } from './en'
import { ru } from './ru'

// Type definition for translations
export type TranslationKey = keyof typeof uz
export type Translations = typeof uz

// Available languages
export const languages = {
  uz: 'Uzbek',
  en: 'English',
  ru: 'Русский',
} as const

export type Language = keyof typeof languages

// Translation objects
export const translations: Record<Language, Partial<Translations>> = {
  uz,
  en,
  ru,
}

// Default language
export const defaultLanguage: Language = 'uz'

// Helper function to get translation
export function t(language: Language, key: TranslationKey): string {
  const translation = translations[language]?.[key]
  return translation || key
}

// Hook for React components (if needed)
export function useTranslation(language: Language) {
  return {
    t: (key: TranslationKey) => t(language, key),
    language,
  }
}
