import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../config/translations';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  availableLanguages: string[];
  loadCustomLanguages: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  const [customLanguages, setCustomLanguages] = useState<Record<string, { baseLanguage: Language; translations: Record<string, string>; displayName?: string }>>({});
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['en', 'ru']);

  const loadCustomLanguages = async () => {
    try {
      if (!projectId || !publicAnonKey) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a1c86d03/kv/prefix/custom-lang-`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const langs: Record<string, any> = {};
        const langNames: string[] = ['en', 'ru'];

        for (const item of (data.values || [])) {
          if (item && item.key) {
            const langName = item.key.replace('custom-lang-', '');
            langs[langName] = item.value;
            langNames.push(langName);
          }
        }

        setCustomLanguages(langs);
        setAvailableLanguages(langNames);
      }
    } catch (error) {
      console.error("[LanguageContext] Failed to load custom languages:", error);
    }
  };

  useEffect(() => {
    loadCustomLanguages();
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    // Check if it's a custom language
    if (language !== 'en' && language !== 'ru') {
      const customLang = customLanguages[language];
      if (customLang) {
        // Return custom translation if exists, otherwise fall back to base language
        if (customLang.translations && customLang.translations[key]) {
          return customLang.translations[key];
        }
        // Fall back to base language
        return translations[customLang.baseLanguage][key] || key;
      }
    }

    // Standard language
    const lang = (language === 'ru' || language === 'en') ? language : 'en';
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages, loadCustomLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
