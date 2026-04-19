const prisma         = require('../config/prisma');
const { randomUUID } = require('crypto');

function newId() {
  return 'c' + randomUUID().replace(/-/g, '').substring(0, 24);
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVED BOOKS
// GET /api/library/saved
// ─────────────────────────────────────────────────────────────────────────────
const getSaved = async (req, res, next) => {
  try {
    const progresses = await prisma.userProgress.findMany({
      where:   { userId: req.user.id, isSaved: true },
      orderBy: { updatedAt: 'desc' },
      include: { book: { select: { id: true, title: true, author: true, coverUrl: true, category: true, fileFormat: true, fileUrl: true } } },
    });
    const books = progresses.filter((p) => p.book).map((p) => ({
      ...p.book,
      savedAt:         p.updatedAt,
      percentComplete: p.percentComplete,
    }));
    res.json({ books });
  } catch (err) { next(err); }
};

// POST /api/library/save/:bookId
const saveBook = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    await prisma.userProgress.upsert({
      where:  { userId_bookId: { userId: req.user.id, bookId } },
      update: { isSaved: true },
      create: { userId: req.user.id, bookId, isSaved: true },
    });
    res.json({ message: 'Book saved.' });
  } catch (err) { next(err); }
};

// DELETE /api/library/save/:bookId
const unsaveBook = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    await prisma.userProgress.update({
      where: { userId_bookId: { userId: req.user.id, bookId } },
      data:  { isSaved: false },
    });
    res.json({ message: 'Book removed from library.' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// HIGHLIGHTS
// GET /api/library/highlights
// ─────────────────────────────────────────────────────────────────────────────
const getHighlights = async (req, res, next) => {
  try {
    const progresses = await prisma.userProgress.findMany({
      where:   { userId: req.user.id },
      include: { book: { select: { id: true, title: true, author: true, coverUrl: true } } },
    });

    const highlights = [];
    for (const p of progresses) {
      const hl = Array.isArray(p.highlights) ? p.highlights : [];
      for (const h of hl) {
        highlights.push({ ...h, bookId: p.bookId, book: p.book });
      }
    }

    // Sort newest first
    highlights.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ highlights });
  } catch (err) { next(err); }
};

// DELETE /api/library/highlights/:bookId/:highlightId
const deleteHighlight = async (req, res, next) => {
  try {
    const { bookId, highlightId } = req.params;
    const progress = await prisma.userProgress.findUnique({
      where: { userId_bookId: { userId: req.user.id, bookId } },
    });
    if (!progress) return res.status(404).json({ message: 'Progress not found.' });

    const highlights = (Array.isArray(progress.highlights) ? progress.highlights : [])
      .filter((h) => h.id !== highlightId);

    await prisma.userProgress.update({
      where: { userId_bookId: { userId: req.user.id, bookId } },
      data:  { highlights },
    });
    res.json({ message: 'Highlight deleted.' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTIONS
// GET /api/library/collections
// ─────────────────────────────────────────────────────────────────────────────
const getCollections = async (req, res, next) => {
  try {
    const collections = await prisma.collection.findMany({
      where:   { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ collections });
  } catch (err) { next(err); }
};

// POST /api/library/collections
const createCollection = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required.' });
    const collection = await prisma.collection.create({
      data: { id: newId(), userId: req.user.id, name: name.trim(), bookIds: [] },
    });
    res.status(201).json({ collection });
  } catch (err) { next(err); }
};

// POST /api/library/collections/:id/books
const addBookToCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ message: 'bookId is required.' });

    const col = await prisma.collection.findFirst({ where: { id, userId: req.user.id } });
    if (!col) return res.status(404).json({ message: 'Collection not found.' });

    const bookIds = Array.isArray(col.bookIds) ? col.bookIds : [];
    if (!bookIds.includes(bookId)) {
      await prisma.collection.update({
        where: { id },
        data:  { bookIds: [...bookIds, bookId] },
      });
    }
    res.json({ message: 'Book added to collection.' });
  } catch (err) { next(err); }
};

// DELETE /api/library/collections/:id
const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const col = await prisma.collection.findFirst({ where: { id, userId: req.user.id } });
    if (!col) return res.status(404).json({ message: 'Collection not found.' });
    await prisma.collection.delete({ where: { id } });
    res.json({ message: 'Collection deleted.' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOADS
// GET /api/library/downloads
// ─────────────────────────────────────────────────────────────────────────────
const getDownloads = async (req, res, next) => {
  try {
    const progresses = await prisma.userProgress.findMany({
      where:   { userId: req.user.id, isDownloaded: true },
      orderBy: { updatedAt: 'desc' },
      include: { book: { select: { id: true, title: true, author: true, coverUrl: true, fileFormat: true, fileUrl: true, pageCount: true } } },
    });
    const downloads = progresses.filter((p) => p.book).map((p) => ({
      ...p.book,
      downloadedAt:    p.updatedAt,
      percentComplete: p.percentComplete,
    }));
    res.json({ downloads });
  } catch (err) { next(err); }
};

// POST /api/library/downloads/:bookId
const markDownloaded = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    await prisma.userProgress.upsert({
      where:  { userId_bookId: { userId: req.user.id, bookId } },
      update: { isDownloaded: true },
      create: { userId: req.user.id, bookId, isDownloaded: true },
    });
    res.json({ message: 'Book marked as downloaded.' });
  } catch (err) { next(err); }
};

// DELETE /api/library/downloads/:bookId
const removeDownload = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    await prisma.userProgress.update({
      where: { userId_bookId: { userId: req.user.id, bookId } },
      data:  { isDownloaded: false },
    });
    res.json({ message: 'Download removed.' });
  } catch (err) { next(err); }
};

module.exports = {
  getSaved, saveBook, unsaveBook,
  getHighlights, deleteHighlight,
  getCollections, createCollection, addBookToCollection, deleteCollection,
  getDownloads, markDownloaded, removeDownload,
};
