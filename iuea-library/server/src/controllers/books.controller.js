const { Book, UserProgress } = require('../models');
const kohaService   = require('../services/koha.service');
const archiveService = require('../services/archive.service');
const { getSignedDownloadUrl } = require('../services/r2.service');

// ── Helpers ───────────────────────────────────────────────────────────────────

function _sortQuery(sort) {
  if (sort === 'popular') return { ratingCount: -1, rating: -1 };
  if (sort === 'rating')  return { rating: -1 };
  return { createdAt: -1 }; // default: newest
}

function _dedupByTitle(lists) {
  const seen  = new Map();
  const out   = [];
  for (const item of lists.flat()) {
    const key = (item.isbn || item.title || '').toLowerCase();
    if (!seen.has(key)) { seen.set(key, true); out.push(item); }
  }
  return out;
}

// ── GET /api/books ────────────────────────────────────────────────────────────
const getBooks = async (req, res, next) => {
  try {
    const { category, language, faculty, sort, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (language) filter.languages = language;
    if (faculty)  filter.faculty   = faculty;

    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort(_sortQuery(sort))
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Book.countDocuments(filter),
    ]);

    res.json({ books, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/books/featured ───────────────────────────────────────────────────
const getFeatured = async (req, res, next) => {
  try {
    // Top rated books; backfill with newest if fewer than 10
    const topRated = await Book.find({ isActive: true, rating: { $gt: 0 } })
      .sort({ rating: -1 })
      .limit(10);

    let books = topRated;
    if (books.length < 10) {
      const ids    = books.map((b) => b._id);
      const newest = await Book.find({ isActive: true, _id: { $nin: ids } })
        .sort({ createdAt: -1 })
        .limit(10 - books.length);
      books = [...books, ...newest];
    }

    res.json({ books });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/books/continue (auth required) ───────────────────────────────────
const getContinueReading = async (req, res, next) => {
  try {
    const progresses = await UserProgress.find({
      userId:          req.user._id,
      percentComplete: { $gt: 0, $lt: 100 },
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('bookId');

    const books = progresses
      .filter((p) => p.bookId)
      .map((p) => ({
        ...p.bookId.toObject(),
        progress: {
          percentComplete: p.percentComplete,
          currentCfi:      p.currentCfi,
          lastDevice:      p.lastDevice,
        },
      }));

    res.json({ books });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/books/search ─────────────────────────────────────────────────────
const searchBooks = async (req, res, next) => {
  try {
    const { q, category, language, faculty, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ message: 'Query parameter q is required.' });

    // 1. MongoDB text search
    const mongoFilter = {
      $text:    { $search: q },
      isActive: true,
    };
    if (category) mongoFilter.category  = category;
    if (language) mongoFilter.languages = language;
    if (faculty)  mongoFilter.faculty   = faculty;

    const [mongoBooks, mongoTotal] = await Promise.all([
      Book.find(mongoFilter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Book.countDocuments(mongoFilter),
    ]);

    // 2. Enrich with Koha + external sources in parallel (non-fatal)
    let kohaBooks  = [];
    let archiveBks = [];
    let gutenbergBks = [];

    if (mongoBooks.length < 5) {
      [kohaBooks, archiveBks, gutenbergBks] = await Promise.allSettled([
        kohaService.searchBooks(q, { limit: 8 }),
        archiveService.searchArchive(q),
        archiveService.searchGutenberg(q),
      ]).then((results) => results.map((r) => (r.status === 'fulfilled' ? r.value : [])));
    } else {
      // Still fetch external results but don't block on Koha
      [archiveBks, gutenbergBks] = await Promise.allSettled([
        archiveService.searchArchive(q),
        archiveService.searchGutenberg(q),
      ]).then((results) => results.map((r) => (r.status === 'fulfilled' ? r.value : [])));
    }

    // Upsert any new Koha books silently
    for (const kb of kohaBooks) {
      if (kb.kohaId) {
        Book.findOneAndUpdate({ kohaId: kb.kohaId }, { $set: kb }, { upsert: true }).catch(() => {});
      }
    }

    // Deduplicate external results against MongoDB results
    const mongoTitles = new Set(mongoBooks.map((b) => b.title.toLowerCase()));
    const external    = _dedupByTitle([archiveBks, gutenbergBks]).filter(
      (b) => !mongoTitles.has((b.title ?? '').toLowerCase())
    );

    res.json({
      books:    mongoBooks,
      external,
      total:    mongoTotal,
      page:     Number(page),
      pages:    Math.ceil(mongoTotal / limit),
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/books/:id ────────────────────────────────────────────────────────
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const bookObj = book.toObject();

    // Signed R2 URL
    if (book.fileKey) {
      try { bookObj.fileUrl = await getSignedDownloadUrl(book.fileKey); } catch {}
    }

    // Koha availability
    if (book.kohaId) {
      try {
        bookObj.availability = await kohaService.getBookItems(book.kohaId);
      } catch {
        bookObj.availability = null;
      }
    }

    // External file URL if no local fileUrl
    if (!bookObj.fileUrl) {
      if (book.archiveId) {
        try { bookObj.fileUrl = await archiveService.getArchiveBookUrl(book.archiveId); } catch {}
      }
    }

    res.json({ book: bookObj });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/books/:id/similar ────────────────────────────────────────────────
const getSimilarBooks = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const similar = await Book.find({
      _id:      { $ne: book._id },
      isActive: true,
      $or: [
        { category: book.category },
        { author:   book.author   },
      ],
    }).limit(6);

    res.json({ books: similar });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBooks, getFeatured, getContinueReading, searchBooks, getBookById, getSimilarBooks };
