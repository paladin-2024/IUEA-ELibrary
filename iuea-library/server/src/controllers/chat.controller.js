const { Book, ChatSession } = require('../models');
const { chatWithBook }       = require('../services/gemini.service');

// POST /api/chat/:bookId
const sendMessage = async (req, res, next) => {
  try {
    const { message, language = 'en' } = req.body;
    const { bookId } = req.params;

    if (!message) return res.status(400).json({ message: 'Message is required.' });

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    let session = await ChatSession.findOne({ user: req.user._id, book: bookId });
    if (!session) {
      session = await ChatSession.create({
        user: req.user._id,
        book: bookId,
        language,
      });
    }

    const history = session.messages.slice(-20);  // last 20 messages for context

    const reply = await chatWithBook({
      bookTitle:       book.title,
      bookDescription: book.description,
      history,
      userMessage:     message,
      language,
    });

    session.messages.push({ role: 'user',      content: message, language });
    session.messages.push({ role: 'assistant', content: reply,   language });
    await session.save();

    res.json({ reply, sessionId: session._id });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/:bookId/history
const getHistory = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      user: req.user._id,
      book: req.params.bookId,
    });
    res.json({ messages: session?.messages || [] });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getHistory };
