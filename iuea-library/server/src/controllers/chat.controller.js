const { Book, ChatSession } = require('../models');
const gemini                = require('../services/gemini.service');

// POST /:bookId — non-streaming reply
const chat = async (req, res, next) => {
  try {
    const { bookId }                                 = req.params;
    const userId                                     = req.user._id;
    const { message, language = 'English', chapter = '' } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'message is required.' });
    }

    const book = await Book.findById(bookId).select('title author faculty');
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const session = await ChatSession.findOneAndUpdate(
      { userId, bookId },
      { $setOnInsert: { userId, bookId, language } },
      { new: true, upsert: true },
    );

    const messages = [
      ...session.messages.slice(-20).map((m) => ({
        role: m.role, content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const reply = await gemini.getChatResponse(messages, book, chapter, language);

    session.messages.push({ role: 'user',      content: message, language });
    session.messages.push({ role: 'assistant', content: reply,   language });
    if (session.messages.length > 100) {
      session.messages.splice(0, session.messages.length - 100);
    }
    await session.save();

    res.json({ reply });
  } catch (err) { next(err); }
};

// GET /:bookId/stream — SSE streaming reply
const streamChat = async (req, res, next) => {
  const { bookId }                                         = req.params;
  const userId                                             = req.user._id;
  const { message, language = 'English', chapter = '' }   = req.query;

  if (!message?.trim()) {
    return res.status(400).json({ message: 'message is required.' });
  }

  res.setHeader('Content-Type',      'text/event-stream');
  res.setHeader('Cache-Control',     'no-cache');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const book = await Book.findById(bookId).select('title author faculty');
    if (!book) {
      res.write(`data: ${JSON.stringify({ error: 'Book not found.' })}\n\n`);
      res.end(); return;
    }

    const session = await ChatSession.findOneAndUpdate(
      { userId, bookId },
      { $setOnInsert: { userId, bookId, language } },
      { new: true, upsert: true },
    );

    const messages = [
      ...session.messages.slice(-20).map((m) => ({
        role: m.role, content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const stream    = await gemini.getChatStream(messages, book, chapter, language);
    let   fullReply = '';

    for await (const chunk of stream) {
      const text = chunk.text();
      fullReply += text;
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    }

    session.messages.push({ role: 'user',      content: message,   language });
    session.messages.push({ role: 'assistant', content: fullReply, language });
    if (session.messages.length > 100) {
      session.messages.splice(0, session.messages.length - 100);
    }
    await session.save();

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};

// GET /:bookId/history
const getHistory = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const session    = await ChatSession.findOne({ userId: req.user._id, bookId });
    const messages   = (session?.messages ?? []).slice(-50);
    res.json({ messages });
  } catch (err) { next(err); }
};

// DELETE /:bookId
const clearHistory = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    await ChatSession.findOneAndUpdate(
      { userId: req.user._id, bookId },
      { $set: { messages: [] } },
    );
    res.json({ message: 'Chat history cleared.' });
  } catch (err) { next(err); }
};

module.exports = { chat, streamChat, getHistory, clearHistory };
