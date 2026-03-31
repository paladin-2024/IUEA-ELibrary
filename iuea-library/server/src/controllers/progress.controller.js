const { UserProgress } = require('../models');

// PUT /api/progress/:bookId
const saveProgress = async (req, res, next) => {
  try {
    const {
      currentPage, currentCfi, totalPages, percentComplete,
      currentChapter, readingLanguage, highlights, bookmarks, device,
    } = req.body;
    const { bookId } = req.params;

    const update = {
      lastReadAt: new Date(),
      ...(currentPage      !== undefined && { currentPage }),
      ...(currentCfi       !== undefined && { currentCfi }),
      ...(totalPages       !== undefined && { totalPages }),
      ...(percentComplete  !== undefined && { percentComplete }),
      ...(currentChapter   !== undefined && { currentChapter }),
      ...(readingLanguage  !== undefined && { readingLanguage }),
      ...(highlights       !== undefined && { highlights }),
      ...(bookmarks        !== undefined && { bookmarks }),
      ...(device           !== undefined && { lastDevice: device }),
    };

    if (percentComplete >= 100) {
      update.isCompleted = true;
      update.completedAt = new Date();
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

// GET /api/progress/:bookId
const getProgress = async (req, res, next) => {
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

// GET /api/progress
const getAllProgress = async (req, res, next) => {
  try {
    const progresses = await UserProgress.find({ userId: req.user._id })
      .populate('bookId', 'title author coverUrl category')
      .sort({ lastReadAt: -1 });
    res.json({ progresses });
  } catch (err) {
    next(err);
  }
};

module.exports = { saveProgress, getProgress, getAllProgress };
