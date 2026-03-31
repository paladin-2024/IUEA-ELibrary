const { Book } = require('../models');
const { getSignedDownloadUrl } = require('../services/r2.service');

// GET /api/books
const listBooks = async (req, res, next) => {
  try {
    const { category, language, page = 1, limit = 20 } = req.query;
    const filter = { isAvailable: true };
    if (category) filter.category = category;
    if (language)  filter.language = language;

    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Book.countDocuments(filter),
    ]);
    res.json({ books, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/featured
const getFeatured = async (req, res, next) => {
  try {
    const books = await Book.find({ isFeatured: true, isAvailable: true }).limit(10);
    res.json({ books });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/search
const searchBooks = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ message: 'Query parameter q is required.' });

    const filter = {
      $text:       { $search: q },
      isAvailable: true,
    };
    const [books, total] = await Promise.all([
      Book.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Book.countDocuments(filter),
    ]);
    res.json({ books, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/:id
const getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    book.viewCount += 1;
    await book.save();

    // Generate signed URL if R2 key exists
    let fileUrl = book.fileUrl;
    if (book.fileKey) {
      fileUrl = await getSignedDownloadUrl(book.fileKey);
    }

    res.json({ book: { ...book.toObject(), fileUrl } });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/:id/similar
const getSimilar = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const similar = await Book.find({
      _id:         { $ne: book._id },
      $or:         [{ category: book.category }, { author: { $in: book.author } }],
      isAvailable: true,
    }).limit(6);
    res.json({ books: similar });
  } catch (err) {
    next(err);
  }
};

module.exports = { listBooks, getFeatured, searchBooks, getBook, getSimilar };
