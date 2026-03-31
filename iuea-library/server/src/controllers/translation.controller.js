const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL || '';

const langMap = {
  English:     'en',
  Swahili:     'sw',
  French:      'fr',
  Arabic:      'ar',
  Luganda:     'lg',
  Kinyarwanda: 'rw',
  Somali:      'so',
  Amharic:     'am',
};

// Resolve a value that may be a full language name ("Swahili") or already a
// BCP-47 code ("sw").  Falls back to the raw value so codes pass through.
function resolveCode(value) {
  if (!value) return 'en';
  return langMap[value] ?? value;
}

// Split text into ≤450-char chunks on sentence boundaries where possible.
function splitIntoChunks(text, maxLen = 450) {
  const chunks = [];
  // Split on sentence-ending punctuation first, then fall back to words.
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) ?? [text];
  let current = '';

  for (const sentence of sentences) {
    if (sentence.length > maxLen) {
      // Long sentence with no punctuation — split on spaces
      if (current) { chunks.push(current.trim()); current = ''; }
      let remaining = sentence;
      while (remaining.length > maxLen) {
        const cut = remaining.lastIndexOf(' ', maxLen);
        const pos = cut > 0 ? cut : maxLen;
        chunks.push(remaining.slice(0, pos).trim());
        remaining = remaining.slice(pos).trim();
      }
      current = remaining;
    } else if ((current + sentence).length > maxLen) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function translateChunk(chunk, sourceLang, targetLang) {
  const params = new URLSearchParams({
    q:        chunk,
    langpair: `${sourceLang}|${targetLang}`,
  });
  if (MYMEMORY_EMAIL) params.set('de', MYMEMORY_EMAIL);

  const url  = `https://api.mymemory.translated.net/get?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`MyMemory HTTP ${resp.status}`);

  const json = await resp.json();
  if (json.responseStatus !== 200) {
    throw new Error(json.responseDetails ?? 'Translation failed');
  }
  return json.responseData.translatedText ?? chunk;
}

// ── translate ─────────────────────────────────────────────────────────────────
// POST /api/translate
const translate = async (req, res, next) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ message: 'text and targetLanguage are required.' });
    }

    const sourceLang = resolveCode(sourceLanguage);
    const targetLang = resolveCode(targetLanguage);

    // If same language, return as-is
    if (sourceLang === targetLang) {
      return res.json({ translatedText: text, sourceLang, targetLang });
    }

    const chunks   = splitIntoChunks(text.trim());
    const results  = [];

    // Sequential — MyMemory free tier has no parallel budget
    for (const chunk of chunks) {
      const translated = await translateChunk(chunk, sourceLang, targetLang);
      results.push(translated);
    }

    res.json({ translatedText: results.join(' '), sourceLang, targetLang });
  } catch (err) {
    next(err);
  }
};

module.exports = { translate };
