const crypto   = require('crypto');
const prisma   = require('../config/prisma');
const { uploadFile, getSignedDownloadUrl } = require('../services/r2.service');

// POST /api/audio/generate
const generateAudio = async (req, res, next) => {
  try {
    const { text, language = 'en', voice = '' } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required.' });
    if (text.length > 5000) return res.status(400).json({ message: 'Text too long (max 5000 chars).' });

    const hash = crypto.createHash('sha256').update(`${text}|${language}|${voice}`).digest('hex');

    const cached = await prisma.audioCache.findFirst({ where: { textHash: hash } });
    if (cached && cached.fileKey) {
      const url = await getSignedDownloadUrl(cached.fileKey);
      return res.json({ audioUrl: url, cached: true });
    }

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GEMINI_API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          input:       { text },
          voice:       { languageCode: language, ssmlGender: 'NEUTRAL', name: voice || undefined },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const err = await ttsResponse.json();
      return res.status(502).json({ message: 'TTS service error.', detail: err });
    }

    const { audioContent } = await ttsResponse.json();
    const buffer = Buffer.from(audioContent, 'base64');

    const { key, publicUrl } = await uploadFile({ buffer, mimeType: 'audio/mpeg', folder: 'audio', extension: 'mp3' });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.audioCache.create({
      data: { textHash: hash, language, voice, fileKey: key, fileUrl: publicUrl, expiresAt },
    });

    const signedUrl = await getSignedDownloadUrl(key);
    res.json({ audioUrl: signedUrl, cached: false });
  } catch (err) { next(err); }
};

module.exports = { generateAudio };
