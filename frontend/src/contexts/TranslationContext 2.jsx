import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import translations, { translateText as translate } from '../i18n/translations';

const TranslationContext = createContext({ language: 'en-US', t: (key, fallback, vars) => translate('en-US', key, fallback, vars) });

export const TranslationProvider = ({ language: initialLanguage = 'en-US', settingsLanguage, children }) => {
  const [language, setLanguage] = useState(initialLanguage);

  useEffect(() => {
    if (settingsLanguage) {
      setLanguage(settingsLanguage);
    }
  }, [settingsLanguage]);

  const value = useMemo(() => ({
    language,
    translations,
    t: (key, fallback, variables) => translate(language, key, fallback, variables)
  }), [language]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);

export default TranslationContext;
