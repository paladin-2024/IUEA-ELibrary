const { UserProgress } = require('../models');

// ── saveProgress ──────────────────────────────────────────────────────────────
// PUT /api/progress/:bookId
const saveProgress = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const {
      currentPage,
      currentCfi,
      percentComplete,
      currentChapter,
      readingLanguage,
      highlights,
      bookmarks,
      device,
    } = req.body;

    const update = { lastReadAt: new Date() };

    if (currentPage     !== undefined) update.currentPage     = currentPage;
    if (currentCfi      !== undefined) update.currentCfi      = currentCfi;
    if (currentChapter  !== undefined) update.currentChapter  = currentChapter;
    if (readingLanguage !== undefined) update.readingLanguage = readingLanguage;
    if (highlights      !== undefined) update.highlights      = highlights;
    if (bookmarks       !== undefined) update.bookmarks       = bookmarks;
    if (device          !== undefined) update.lastDevice      = device;

    if (percentComplete !== undefined) {
      update.percentComplete = percentComplete;
      if (percentComplete >= 100) {
        update.isCompleted = true;
      }
    }

    const progress = await UserProgress.findOneAndUpdate(
      { userId: req.user._id, bookId },
      { $set: update },
      { new: true, upsert: true }
    );

    res.json({ progress });
  } catch (err) {
    next(err);
  }
};

// ── loadProgress ──────────────────────────────────────────────────────────────
// GET /api/progress/:bookId
const loadProgress = async (req, res, next) => {
  try {
    const progress = await UserProgress.findOne({
      userId: req.user._id,
      bookId: req.params.bookId,
    });
    res.json({ progress: progress || null });
  } catch (err) {
    next(err);
  }
};

// ── getAllProgress ────────────────────────────────────────────────────────────
// GET /api/progress
const getAllProgress = async (req, res, next) => {
  try {
    const progresses = await UserProgress.find({ userId: req.user._id })
      .populate('bookId', 'title author coverUrl category fileFormat fileUrl')
      .sort({ lastReadAt: -1 });
    res.json({ progresses });
  } catch (err) {
    next(err);
  }
};

module.exports = { saveProgress, loadProgress, getAllProgress };
