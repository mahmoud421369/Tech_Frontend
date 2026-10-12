import { useEffect, useState } from 'react';

export const useAppLanguage = () => {
  const [language, setLanguage] = useState(() => localStorage.getItem('appLanguage') || 'en');

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = languageDirection(language);
  }, [language]);

  useEffect(() => {
    const updateLanguage = () => setLanguage(localStorage.getItem('appLanguage') || 'en');
    window.addEventListener('appLanguageChanged', updateLanguage);
    window.addEventListener('storage', updateLanguage);
    return () => {
      window.removeEventListener('appLanguageChanged', updateLanguage);
      window.removeEventListener('storage', updateLanguage);
    };
  }, []);

  return language;
};

export const languageDirection = (language) => (language === 'ar' ? 'rtl' : 'ltr');
