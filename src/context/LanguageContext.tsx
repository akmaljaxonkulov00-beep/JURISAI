'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, t as translate, defaultLanguage, translations } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof translations.uz) => string;
  availableLanguages: Record<Language, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'jurisai-language';

const availableLanguages: Record<Language, string> = {
  uz: 'Uzbek',
  en: 'English',
  ru: 'Русский',
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEY) as Language;
    if (savedLanguage && availableLanguages[savedLanguage]) {
      setLanguageState(savedLanguage);
    } else {
      // Check for cookie set by middleware
      const cookieLanguage = document.cookie
        .split('; ')
        .find(row => row.startsWith('jurisai-language='))
        ?.split('=')[1] as Language;
      
      if (cookieLanguage && availableLanguages[cookieLanguage]) {
        setLanguageState(cookieLanguage);
        localStorage.setItem(STORAGE_KEY, cookieLanguage);
      } else {
        // Auto-detect browser language
        const browserLanguage = navigator.language.split('-')[0] as Language;
        if (availableLanguages[browserLanguage]) {
          setLanguageState(browserLanguage);
        }
      }
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    if (availableLanguages[newLanguage]) {
      setLanguageState(newLanguage);
      localStorage.setItem(STORAGE_KEY, newLanguage);
    }
  };

  const t = (key: keyof typeof translations.uz): string => {
    const translation = translations[language]?.[key];
    return translation || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
