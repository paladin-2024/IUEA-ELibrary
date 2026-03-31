const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL || '';

const langMap = {
  english:    'en', french:     'fr', arabic:     'ar',
  swahili:    'sw', luganda:    'lg', spanish:    'es',
  portuguese: 'pt', german:     'de', chinese:    'zh',
  japanese:   'ja', hindi:      'hi', russian:    'ru',
  kiswahili:  'sw', luganda:    'lg',
};

function toCode(lang) {
  if (!lang) return 'en';
  const lower = lang.toLowerCase().trim();
  return langMap[lower] || lower;
}

async function translateChunk(text, targetLang, sourceLang) {
  const params = new URLSearchParams({
    q:        text,
    langpair: `${sourceLang}|${targetLang}`,
    ...(MYMEMORY_EMAIL && { de: MYMEMORY_EMAIL }),
  });
  const resp = await fetch(`https://api.mymemory.translated.net/get?${params}`);
  if (!resp.ok) throw new Error(`MyMemory HTTP ${resp.status}`);
  const json = await resp.json();
  if (json.responseStatus !== 200) {
    throw new Error(json.responseDetails || 'Translation failed');
  }
  return json.responseData.translatedText;
}

async function translateLong(text, targetLang, sourceLang) {
  const CHUNK = 450;
  // Split on sentence boundaries, keeping delimiters
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks = [];
  let current  = '';

  for (const s of sentences) {
    if ((current + s).length > CHUNK) {
      if (current.trim()) chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  const results = [];
  for (const chunk of chunks) {
    // Sequential to avoid rate-limit on free tier
    results.push(await translateChunk(chunk, targetLang, sourceLang));
  }
  return results.join(' ');
}

// POST /api/translate
const translate = async (req, res, next) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ message: 'text and targetLanguage are required.' });
    }

    const targetCode = toCode(targetLanguage);
    const sourceCode = toCode(sourceLanguage);

    if (targetCode === sourceCode) {
      return res.json({ translated: text, targetLanguage: targetCode, sourceLanguage: sourceCode });
    }

    const translated = await translateLong(text, targetCode, sourceCode);
    res.json({ translated, targetLanguage: targetCode, sourceLanguage: sourceCode });
  } catch (err) {
    next(err);
  }
};

module.exports = { translate };
