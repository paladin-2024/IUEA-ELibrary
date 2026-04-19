const prisma  = require('../config/prisma');
const gemini  = require('../services/gemini.service');

// POST /api/chat/:bookId
const chat = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;
    const { message, language = 'English', chapter = '' } = req.body;

    if (!message?.trim())
      return res.status(400).json({ message: 'message is required.' });

    const book = await prisma.book.findUnique({
      where:  { id: bookId },
      select: { id: true, title: true, author: true, faculty: true },
    });
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    let session = await prisma.chatSession.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    if (!session) {
      session = await prisma.chatSession.create({ data: { userId, bookId, language } });
    }

    const history = (session.messages || []).slice(-20).map((m) => ({ role: m.role, content: m.content }));
    const messages = [...history, { role: 'user', content: message }];

    const reply = await gemini.getChatResponse(messages, book, chapter, language);

    let updatedMessages = [
      ...(session.messages || []),
      { role: 'user',      content: message, language, timestamp: new Date() },
      { role: 'assistant', content: reply,   language, timestamp: new Date() },
    ];
    if (updatedMessages.length > 100) updatedMessages = updatedMessages.slice(-100);

    await prisma.chatSession.update({
      where: { id: session.id },
      data:  { messages: updatedMessages },
    });

    res.json({ reply });
  } catch (err) { next(err); }
};

// GET /api/chat/:bookId/stream
const streamChat = async (req, res, next) => {
  const { bookId } = req.params;
  const userId = req.user.id;
  const { message, language = 'English', chapter = '' } = req.query;

  if (!message?.trim())
    return res.status(400).json({ message: 'message is required.' });

  res.setHeader('Content-Type',      'text/event-stream');
  res.setHeader('Cache-Control',     'no-cache');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const book = await prisma.book.findUnique({
      where:  { id: bookId },
      select: { id: true, title: true, author: true, faculty: true },
    });
    if (!book) {
      res.write(`data: ${JSON.stringify({ error: 'Book not found.' })}\n\n`);
      res.end(); return;
    }

    let session = await prisma.chatSession.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });
    if (!session) {
      session = await prisma.chatSession.create({ data: { userId, bookId, language } });
    }

    const history  = (session.messages || []).slice(-20).map((m) => ({ role: m.role, content: m.content }));
    const messages = [...history, { role: 'user', content: message }];

    const stream    = await gemini.getChatStream(messages, book, chapter, language);
    let   fullReply = '';

    for await (const chunk of stream) {
      const text = chunk.text();
      fullReply += text;
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    }

    let updatedMessages = [
      ...(session.messages || []),
      { role: 'user',      content: message,   language, timestamp: new Date() },
      { role: 'assistant', content: fullReply, language, timestamp: new Date() },
    ];
    if (updatedMessages.length > 100) updatedMessages = updatedMessages.slice(-100);

    await prisma.chatSession.update({
      where: { id: session.id },
      data:  { messages: updatedMessages },
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
};

// GET /api/chat/:bookId/history
const getHistory = async (req, res, next) => {
  try {
    const session  = await prisma.chatSession.findUnique({
      where: { userId_bookId: { userId: req.user.id, bookId: req.params.bookId } },
    });
    res.json({ messages: (session?.messages ?? []).slice(-50) });
  } catch (err) { next(err); }
};

// DELETE /api/chat/:bookId
const clearHistory = async (req, res, next) => {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { userId_bookId: { userId: req.user.id, bookId: req.params.bookId } },
    });
    if (session) {
      await prisma.chatSession.update({ where: { id: session.id }, data: { messages: [] } });
    }
    res.json({ message: 'Chat history cleared.' });
  } catch (err) { next(err); }
};

module.exports = { chat, streamChat, getHistory, clearHistory };
