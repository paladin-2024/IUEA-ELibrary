const { UserProgress } = require('../models');

// PUT /api/progress/:bookId
const saveProgress = async (req, res, next) => {
  try {
    const { currentPage, currentCfi, totalPages, percentage, highlights, bookmarks } = req.body;
    const { bookId } = req.params;

    const update = {
      lastReadAt: new Date(),
      ...(currentPage  !== undefined && { currentPage }),
      ...(currentCfi   !== undefined && { currentCfi }),
      ...(totalPages   !== undefined && { totalPages }),
      ...(percentage   !== undefined && { percentage }),
      ...(highlights   !== undefined && { highlights }),
      ...(bookmarks    !== undefined && { bookmarks }),
    };

    if (percentage >= 100) {
      update.isCompleted = true;
      update.completedAt  = new Date();
    }

    const progress = await UserProgress.findOneAndUpdate(
      { user: req.user._id, book: bookId },
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
      user: req.user._id,
      book: req.params.bookId,
    });
    res.json({ progress: progress || null });
  } catch (err) {
    next(err);
  }
};

// GET /api/progress
const getAllProgress = async (req, res, next) => {
  try {
    const progresses = await UserProgress.find({ user: req.user._id })
      .populate('book', 'title author coverUrl category')
      .sort({ lastReadAt: -1 });
    res.json({ progresses });
  } catch (err) {
    next(err);
  }
};

module.exports = { saveProgress, getProgress, getAllProgress };
