'use strict';

const prisma = require('../config/prisma');

// ── POST /api/reviews/:bookId ─────────────────────────────────────────────────
const addReview = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { rating, text } = req.body;


    const progress = await prisma.userProgress.findUnique({
      where: { userId_bookId: { userId: req.user.id, bookId } },
    });
    const isVerified = (progress?.percentComplete ?? 0) >= 30;

    const review = await prisma.review.upsert({
      where:  { userId_bookId: { userId: req.user.id, bookId } },
      update: { rating: Number(rating), text: text?.trim() ?? '', isVerified },
      create: { userId: req.user.id, bookId, rating: Number(rating), text: text?.trim() ?? '', isVerified },
    });

    await _recalcBookRating(bookId);
    res.status(201).json({ review });
  } catch (err) { next(err); }
};

// ── GET /api/reviews/:bookId ──────────────────────────────────────────────────
const getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { sort = 'recent', page = 1, limit = 10 } = req.query;

    const orderByMap = {
      recent:  { createdAt: 'desc' },
      highest: { rating: 'desc' },
      lowest:  { rating: 'asc' },
    };
    // 'helpful' sorted by array length requires raw SQL — handled post-query
    const needsHelpfulSort = sort === 'helpful';
    const orderBy = needsHelpfulSort ? { createdAt: 'desc' } : (orderByMap[sort] ?? orderByMap.recent);

    const skip  = (Number(page) - 1) * Number(limit);
    const [total, reviews] = await Promise.all([
      prisma.review.count({ where: { bookId } }),
      prisma.review.findMany({
        where:   { bookId },
        orderBy,
        skip,
        take:    Number(limit),
        include: { user: { select: { name: true, avatar: true, faculty: true } } },
      }),
    ]);

    const userId = req.user?.id;
    let mapped = reviews.map((r) => ({
      ...r,
      helpfulCount: r.helpfulVotes?.length ?? 0,
      votedHelpful: userId ? r.helpfulVotes?.includes(userId) : false,
    }));
    if (needsHelpfulSort) {
      mapped = mapped.sort((a, b) => b.helpfulCount - a.helpfulCount);
    }

    // Rating breakdown via groupBy
    const breakdown = await prisma.review.groupBy({
      by:    ['rating'],
      where: { bookId },
      _count: { rating: true },
    });
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const b of breakdown) ratingBreakdown[b.rating] = b._count.rating;

    res.json({ reviews: mapped, total, ratingBreakdown });
  } catch (err) { next(err); }
};

// ── DELETE /api/reviews/:bookId ───────────────────────────────────────────────
const deleteReview = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const where = req.user.role === 'admin'
      ? { bookId }
      : { userId: req.user.id, bookId };

    const count = await prisma.review.deleteMany({ where });
    if (count.count === 0) return res.status(404).json({ message: 'Review not found.' });

    await _recalcBookRating(bookId);
    res.json({ message: 'Review deleted.' });
  } catch (err) { next(err); }
};

// ── POST /api/reviews/:bookId/helpful ─────────────────────────────────────────
const voteHelpful = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { reviewId } = req.body;

    const review = await prisma.review.findFirst({ where: { id: reviewId, bookId } });
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    const uid   = req.user.id;
    const voted = review.helpfulVotes.includes(uid);
    const newVotes = voted
      ? review.helpfulVotes.filter((v) => v !== uid)
      : [...review.helpfulVotes, uid];

    await prisma.review.update({ where: { id: reviewId }, data: { helpfulVotes: newVotes } });
    res.json({ helpfulCount: newVotes.length, voted: !voted });
  } catch (err) { next(err); }
};

// ── GET /api/reviews/my/:bookId ───────────────────────────────────────────────
const getMyReview = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({
      where: { userId_bookId: { userId: req.user.id, bookId: req.params.bookId } },
    });
    res.json({ review: review ?? null });
  } catch (err) { next(err); }
};

// ── Internal: recalculate book avg rating ─────────────────────────────────────
async function _recalcBookRating(bookId) {
  const agg = await prisma.review.aggregate({
    where:  { bookId },
    _avg:   { rating: true },
    _count: { rating: true },
  });
  await prisma.book.update({
    where: { id: bookId },
    data: {
      rating:      agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      ratingCount: agg._count.rating ?? 0,
    },
  });
}

module.exports = { addReview, getBookReviews, deleteReview, voteHelpful, getMyReview };
