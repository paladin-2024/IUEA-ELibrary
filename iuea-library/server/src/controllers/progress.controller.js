const prisma = require('../config/prisma');
const { randomUUID } = require('crypto');
const { updateStreak } = require('./streaks.controller');

// PUT /api/progress/:bookId
const saveProgress = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const {
      currentPage, currentCfi, percentComplete, currentChapter,
      readingLanguage, highlights, bookmarks, device, minutesRead,
    } = req.body;

    const data = { lastReadAt: new Date() };
    if (currentPage     !== undefined) data.currentPage     = currentPage;
    if (currentCfi      !== undefined) data.currentCfi      = currentCfi;
    if (currentChapter  !== undefined) data.currentChapter  = currentChapter;
    if (readingLanguage !== undefined) data.readingLanguage = readingLanguage;
    if (highlights      !== undefined) data.highlights      = highlights.map((h) => h._id || h.id ? h : { ...h, id: randomUUID() });
    if (bookmarks       !== undefined) data.bookmarks       = bookmarks;
    if (device          !== undefined) data.lastDevice      = device;
    if (minutesRead     >  0)          data.totalReadingMinutes = { increment: Math.floor(minutesRead) };
    if (percentComplete !== undefined) {
      data.percentComplete = percentComplete;
      if (percentComplete >= 100) data.isCompleted = true;
    }

    const progress = await prisma.userProgress.upsert({
      where:  { userId_bookId: { userId: req.user.id, bookId } },
      update: data,
      create: { userId: req.user.id, bookId, ...data },
    });

    // Update streak & XP (fire-and-forget)
    updateStreak(req.user.id, {
      minutesRead:     minutesRead ?? 0,
      isCompleted:     percentComplete >= 100,
      readingLanguage: readingLanguage ?? 'English',
      hour:            new Date().getHours(),
    }).catch(() => {});

    res.json({ progress });
  } catch (err) { next(err); }
};

// GET /api/progress/:bookId
const loadProgress = async (req, res, next) => {
  try {
    const progress = await prisma.userProgress.findUnique({
      where: { userId_bookId: { userId: req.user.id, bookId: req.params.bookId } },
    });
    res.json({ progress: progress || null });
  } catch (err) { next(err); }
};

// GET /api/progress
const getAllProgress = async (req, res, next) => {
  try {
    const progresses = await prisma.userProgress.findMany({
      where:   { userId: req.user.id },
      orderBy: { lastReadAt: 'desc' },
      include: {
        book: { select: { id: true, title: true, author: true, coverUrl: true, category: true, fileFormat: true, fileUrl: true } },
      },
    });
    res.json({ progress: progresses });
  } catch (err) { next(err); }
};

module.exports = { saveProgress, loadProgress, getAllProgress };
