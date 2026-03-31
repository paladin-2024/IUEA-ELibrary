const { User, Book, UserProgress, ChatSession, Podcast } = require('../models');
const { searchBiblio, getBiblio }    = require('../services/koha.service');
const { searchArchive, getArchiveItem } = require('../services/archive.service');

// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [users, books, sessions, podcasts] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      ChatSession.countDocuments(),
      Podcast.countDocuments(),
    ]);
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt');
    res.json({ stats: { users, books, sessions, podcasts }, recentUsers });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      User.countDocuments(),
    ]);
    res.json({ users, total });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/books/sync  — sync books from Koha
const syncKohaBooks = async (req, res, next) => {
  try {
    const { q = '', limit = 100 } = req.body;
    const results = await searchBiblio({ q, limit });
    let synced = 0;

    for (const item of results) {
      await Book.findOneAndUpdate(
        { kohaId: String(item.biblio_id) },
        {
          $set: {
            kohaId:    String(item.biblio_id),
            title:     item.title || 'Untitled',
            author:    item.author ? [item.author] : [],
            isbn:      item.isbn,
            language:  item.language || 'en',
            source:    'koha',
          },
        },
        { upsert: true }
      );
      synced++;
    }
    res.json({ message: `Synced ${synced} books from Koha.` });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/books  — manually create a book
const createBook = async (req, res, next) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ book });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/books/:id
const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    res.json({ book });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/books/:id
const deleteBook = async (req, res, next) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, listUsers, syncKohaBooks, createBook, updateBook, deleteBook };
