import { useState, useCallback } from 'react';
import api from '../services/api';

export default function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error,         setError]         = useState(null);

  const translate = useCallback(async (text, targetLanguage, sourceLanguage = 'en') => {
    if (!text || !targetLanguage) return null;

    // Cache in sessionStorage — key from lang + first 80 chars of text
    const cacheKey = `tr_${targetLanguage}_${sourceLanguage}_${btoa(encodeURIComponent(text.slice(0, 80))).slice(0, 40)}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) return cached;
    } catch (_) {}

    setIsTranslating(true);
    setError(null);
    try {
      const { data } = await api.post('/translate', { text, targetLanguage, sourceLanguage });
      try { sessionStorage.setItem(cacheKey, data.translated); } catch (_) {}
      return data.translated;
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Translation failed';
      setError(msg);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { translate, isTranslating, error, clearError };
}
