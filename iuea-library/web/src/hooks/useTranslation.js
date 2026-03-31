import { useState, useCallback } from 'react';
import api from '../services/api';

// Cache key: bookId + chapter index + language code
function cacheKey(bookId, chapter, lang) {
  return `tr_${bookId}_ch${chapter}_${lang}`;
}

export default function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error,         setError]         = useState(null);

  /**
   * translateChapter — translate the full chapter text and cache the result.
   *
   * @param {string} text           - Source text (English)
   * @param {string} targetLanguage - Language name or BCP-47 code
   * @param {string} bookId         - For cache key namespacing
   * @param {number} chapter        - Chapter index for cache key
   * @returns {Promise<string|null>} - Translated text, or null on error
   */
  const translateChapter = useCallback(
    async (text, targetLanguage, bookId, chapter) => {
      if (!text || !targetLanguage) return null;

      const key = cacheKey(bookId, chapter, targetLanguage);

      // Return cached result if available
      try {
        const cached = sessionStorage.getItem(key);
        if (cached) return cached;
      } catch (_) {}

      setIsTranslating(true);
      setError(null);

      try {
        const { data } = await api.post('/translate', {
          text,
          targetLanguage,
          sourceLanguage: 'en',
        });

        const result = data.translatedText ?? text;

        try {
          sessionStorage.setItem(key, result);
        } catch (_) {}

        return result;
      } catch (err) {
        const msg = err.response?.data?.message ?? 'Translation failed. Please try again.';
        setError(msg);
        return null;
      } finally {
        setIsTranslating(false);
      }
    },
    []
  );

  return { translateChapter, isTranslating, error };
}
