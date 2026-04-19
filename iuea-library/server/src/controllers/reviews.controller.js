const Review   = require('../models/Review');
const prisma   = require('../config/prisma');
const mongoose = require('mongoose');

// ── POST /api/reviews/:bookId ─────────────────────────────────────────────────
const addReview = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { rating, text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating must be 1–5.' });
    }

    // Check if user has read enough to be "verified"
    const progress = await prisma.userProgress.findUnique({
      where: { userId_bookId: { userId: req.user.id, bookId } },
    });
    const isVerified = (progress?.percentComplete ?? 0) >= 30;

    const review = await Review.findOneAndUpdate(
      { userId: req.user.id, bookId },
      { rating, text: text?.trim() ?? '', isVerified },
      { upsert: true, new: true }
    ).lean();

    await _recalcBookRating(bookId);

    review.id = review._id.toString();
    res.status(201).json({ review });
  } catch (err) { next(err); }
};

// ── GET /api/reviews/:bookId ──────────────────────────────────────────────────
const getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { sort = 'recent', page = 1, limit = 10 } = req.query;

    const sortMap = {
      recent:   { createdAt: -1 },
      helpful:  { helpfulVotes: -1 },
      highest:  { rating: -1 },
      lowest:   { rating: 1 },
    };

    const skip    = (Number(page) - 1) * Number(limit);
    const total   = await Review.countDocuments({ bookId });
    const reviews = await Review.find({ bookId })
      .sort(sortMap[sort] ?? sortMap.recent)
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'name avatar faculty')
      .lean();

    // Attach helpful count and whether current user voted
    const userId = req.user?.id;
    const mapped = reviews.map(r => ({
      ...r,
      id:           r._id.toString(),
      helpfulCount: r.helpfulVotes?.length ?? 0,
      votedHelpful: userId ? r.helpfulVotes?.includes(userId) : false,
      user:         r.userId,
    }));

    // Rating breakdown
    const breakdown = await Review.aggregate([
      { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const b of breakdown) ratingBreakdown[b._id] = b.count;

    res.json({ reviews: mapped, total, ratingBreakdown });
  } catch (err) { next(err); }
};

// ── DELETE /api/reviews/:bookId ───────────────────────────────────────────────
const deleteReview = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const filter = req.user.role === 'admin'
      ? { bookId }
      : { userId: req.user.id, bookId };

    const del = await Review.findOneAndDelete(filter);
    if (!del) return res.status(404).json({ message: 'Review not found.' });

    await _recalcBookRating(bookId);
    res.json({ message: 'Review deleted.' });
  } catch (err) { next(err); }
};

// ── POST /api/reviews/:bookId/helpful ─────────────────────────────────────────
const voteHelpful = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { reviewId } = req.body;
    if (!reviewId) return res.status(400).json({ message: 'reviewId required.' });

    const review = await Review.findOne({ _id: reviewId, bookId });
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    const uid   = req.user.id;
    const voted = review.helpfulVotes.includes(uid);
    if (voted) {
      review.helpfulVotes = review.helpfulVotes.filter(v => v !== uid);
    } else {
      review.helpfulVotes.push(uid);
    }
    await review.save();

    res.json({ helpfulCount: review.helpfulVotes.length, voted: !voted });
  } catch (err) { next(err); }
};

// ── GET /api/reviews/my/:bookId ───────────────────────────────────────────────
const getMyReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ userId: req.user.id, bookId: req.params.bookId }).lean();
    if (review) review.id = review._id.toString();
    res.json({ review: review || null });
  } catch (err) { next(err); }
};

// ── Internal: recalculate book avg rating ─────────────────────────────────────
async function _recalcBookRating(bookId) {
  const [agg] = await Review.aggregate([
    { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await prisma.book.update({
    where: { id: bookId },
    data: {
      rating:      agg ? Math.round(agg.avg * 10) / 10 : 0,
      ratingCount: agg?.count ?? 0,
    },
  });
}

module.exports = { addReview, getBookReviews, deleteReview, voteHelpful, getMyReview };
