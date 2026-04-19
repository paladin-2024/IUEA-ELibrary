const prisma           = require('../config/prisma');
const kohaService      = require('../services/koha.service');
const archiveService   = require('../services/archive.service');
const { searchOpenLibrary } = require('../services/openlibrary.service');
const { getSignedDownloadUrl } = require('../services/r2.service');

function _sortOrder(sort) {
  if (sort === 'popular') return [{ ratingCount: 'desc' }, { rating: 'desc' }];
  if (sort === 'rating')  return [{ rating: 'desc' }];
  return [{ createdAt: 'desc' }];
}

function _dedupByTitle(lists) {
  const seen = new Map();
  const out  = [];
  for (const item of lists.flat()) {
    const key = (item.isbn || item.title || '').toLowerCase();
    if (!seen.has(key)) { seen.set(key, true); out.push(item); }
  }
  return out;
}

// GET /api/books
const getBooks = async (req, res, next) => {
  try {
    const { category, language, faculty, sort, page = 1, limit = 20 } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;
    if (language) where.languages = { has: language };
    if (faculty)  where.faculty   = { has: faculty };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: _sortOrder(sort),
        skip:    (page - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.book.count({ where }),
    ]);

    res.json({ books, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// GET /api/books/featured
const getFeatured = async (req, res, next) => {
  try {
    let books = await prisma.book.findMany({
      where:   { isActive: true, rating: { gt: 0 } },
      orderBy: { rating: 'desc' },
      take:    10,
    });
    if (books.length < 10) {
      const ids    = books.map((b) => b.id);
      const newest = await prisma.book.findMany({
        where:   { isActive: true, id: { notIn: ids } },
        orderBy: { createdAt: 'desc' },
        take:    10 - books.length,
      });
      books = [...books, ...newest];
    }
    // Fall back to Gutenberg when DB has fewer than 10 books
    if (books.length < 10) {
      try {
        const external = await archiveService.searchGutenberg('academic university education');
        const dbTitles = new Set(books.map((b) => b.title.toLowerCase()));
        const fill = external
          .filter((b) => b.coverUrl && !dbTitles.has((b.title ?? '').toLowerCase()))
          .slice(0, 10 - books.length);
        books = [...books, ...fill];
      } catch {}
    }
    res.json({ books });
  } catch (err) { next(err); }
};

// GET /api/books/continue
const getContinueReading = async (req, res, next) => {
  try {
    const progresses = await prisma.userProgress.findMany({
      where:   { userId: req.user.id, percentComplete: { gt: 0, lt: 100 } },
      orderBy: { updatedAt: 'desc' },
      take:    10,
      include: { book: true },
    });

    const books = progresses
      .filter((p) => p.book)
      .map((p) => ({
        ...p.book,
        progress: { percentComplete: p.percentComplete, currentCfi: p.currentCfi, lastDevice: p.lastDevice },
      }));

    res.json({ books });
  } catch (err) { next(err); }
};

// GET /api/books/search
const searchBooks = async (req, res, next) => {
  try {
    const { q, category, language, faculty, page = 1, limit = 200 } = req.query;
    if (!q) return res.status(400).json({ message: 'Query parameter q is required.' });

    const where = {
      isActive: true,
      OR: [
        { title:       { contains: q, mode: 'insensitive' } },
        { author:      { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { isbn:        { contains: q, mode: 'insensitive' } },
      ],
    };
    if (category) where.category  = category;
    if (language) where.languages = { has: language };
    if (faculty)  where.faculty   = { has: faculty };

    const [dbBooks, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.book.count({ where }),
    ]);

    // Fetch from all external sources in parallel — failures are silently ignored
    const [archiveBks, gutenbergBks, olBooks] = await Promise.allSettled([
      archiveService.searchArchive(q),
      archiveService.searchGutenberg(q),
      searchOpenLibrary(q, { limit: 40 }),
    ]).then((results) => results.map((r) => (r.status === 'fulfilled' ? r.value : [])));

    const dbTitles = new Set(dbBooks.map((b) => b.title.toLowerCase()));
    const external = _dedupByTitle([archiveBks, gutenbergBks, olBooks]).filter(
      (b) => !dbTitles.has((b.title ?? '').toLowerCase())
    );

    res.json({ books: dbBooks, external, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// GET /api/books/:id
const getBookById = async (req, res, next) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const bookObj = { ...book };

    if (book.fileKey) {
      try { bookObj.fileUrl = await getSignedDownloadUrl(book.fileKey); } catch {}
    }
    if (book.kohaId) {
      try { bookObj.availability = await kohaService.getBookItems(book.kohaId); } catch { bookObj.availability = null; }
    }
    if (!bookObj.fileUrl && book.archiveId) {
      try { bookObj.fileUrl = await archiveService.getArchiveBookUrl(book.archiveId); } catch {}
    }

    res.json({ book: bookObj });
  } catch (err) { next(err); }
};

// GET /api/books/:id/similar
const getSimilarBooks = async (req, res, next) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const similar = await prisma.book.findMany({
      where: {
        id:       { not: book.id },
        isActive: true,
        OR: [{ category: book.category }, { author: book.author }],
      },
      take: 6,
    });

    res.json({ books: similar });
  } catch (err) { next(err); }
};

// POST /api/books/resolve  — import an external book into the DB and return its real record
const resolveBook = async (req, res, next) => {
  try {
    const {
      title, author, gutenbergId, archiveId, openLibraryKey,
      isbn, coverUrl, category, fileUrl: inputFileUrl,
      fileFormat, description, languages, source,
    } = req.body;

    if (!title) return res.status(400).json({ message: 'title is required' });

    // ── 1. Check existing ──────────────────────────────────────────────────────
    let existing = null;
    if (gutenbergId)    existing = await prisma.book.findUnique({ where: { gutenbergId: Number(gutenbergId) } });
    if (!existing && archiveId) existing = await prisma.book.findUnique({ where: { archiveId } });
    if (!existing && isbn)      existing = await prisma.book.findFirst({ where: { isbn } });
    if (!existing) {
      existing = await prisma.book.findFirst({
        where: {
          title:  { equals: title, mode: 'insensitive' },
          author: { contains: (author ?? '').split(',')[0].trim(), mode: 'insensitive' },
        },
      });
    }

    if (existing) {
      const bookObj = { ...existing };
      if (!bookObj.fileUrl && bookObj.fileKey) {
        try { bookObj.fileUrl = await getSignedDownloadUrl(bookObj.fileKey); } catch {}
      }
      if (!bookObj.fileUrl && bookObj.archiveId) {
        try { bookObj.fileUrl = await archiveService.getArchiveBookUrl(bookObj.archiveId); } catch {}
      }
      return res.json({ book: bookObj });
    }

    // ── 2. Resolve file URL for archive books ──────────────────────────────────
    let fileUrl = inputFileUrl ?? null;
    let resolvedFormat = fileFormat ?? null;
    if (source === 'archive' && archiveId && !fileUrl) {
      try {
        fileUrl = await archiveService.getArchiveBookUrl(archiveId);
        if (fileUrl) resolvedFormat = fileUrl.toLowerCase().endsWith('.epub') ? 'epub' : 'pdf';
      } catch {}
    }

    // ── 3. Build create payload ────────────────────────────────────────────────
    const payload = {
      title:         title ?? 'Unknown Title',
      author:        author ?? 'Unknown',
      category:      category ?? 'General',
      coverUrl:      coverUrl   ?? null,
      description:   description ?? null,
      isbn:          isbn ?? null,
      fileUrl:       fileUrl ?? null,
      fileFormat:    resolvedFormat ?? null,
      languages:     languages ?? ['English'],
      isActive:      true,
    };
    if (gutenbergId)   payload.gutenbergId   = Number(gutenbergId);
    if (archiveId)     payload.archiveId     = archiveId;

    // ── 4. Upsert / create ─────────────────────────────────────────────────────
    let book;
    if (gutenbergId) {
      book = await prisma.book.upsert({
        where:  { gutenbergId: Number(gutenbergId) },
        create: payload,
        update: { fileUrl: payload.fileUrl, coverUrl: payload.coverUrl, description: payload.description },
      });
    } else if (archiveId) {
      book = await prisma.book.upsert({
        where:  { archiveId },
        create: payload,
        update: { fileUrl: payload.fileUrl, coverUrl: payload.coverUrl },
      });
    } else {
      book = await prisma.book.create({ data: payload });
    }

    res.json({ book });
  } catch (err) { next(err); }
};

module.exports = { getBooks, getFeatured, getContinueReading, searchBooks, getBookById, getSimilarBooks, resolveBook };
