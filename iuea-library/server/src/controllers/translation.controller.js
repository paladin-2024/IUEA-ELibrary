const { translateLong } = require('../services/translate.service');

// POST /api/translate
const translate = async (req, res, next) => {
  try {
    const { text, targetLang, sourceLang = 'en' } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ message: 'text and targetLang are required.' });
    }

    const translated = await translateLong(text, targetLang, sourceLang);
    res.json({ translated, targetLang, sourceLang });
  } catch (err) {
    next(err);
  }
};

module.exports = { translate };
