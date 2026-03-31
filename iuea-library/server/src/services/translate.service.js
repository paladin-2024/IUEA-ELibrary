const axios = require('axios');

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

const translateText = async (text, targetLang, sourceLang = 'en') => {
  if (sourceLang === targetLang) return text;

  try {
    const response = await axios.get(MYMEMORY_URL, {
      params: {
        q:    text.substring(0, 500),   // MyMemory 500-char limit per request
        langpair: `${sourceLang}|${targetLang}`,
        de:   process.env.MYMEMORY_EMAIL || '',
      },
    });

    const data = response.data;
    if (data.responseStatus === 200) {
      return data.responseData.translatedText;
    }
    throw new Error(data.responseDetails || 'Translation failed');
  } catch (err) {
    console.error('Translation error:', err.message);
    return text;  // fallback to original
  }
};

const translateLong = async (text, targetLang, sourceLang = 'en') => {
  if (sourceLang === targetLang) return text;

  const chunkSize = 490;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks    = [];
  let   current   = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  const translated = await Promise.all(
    chunks.map((chunk) => translateText(chunk, targetLang, sourceLang))
  );
  return translated.join(' ');
};

module.exports = { translateText, translateLong };
