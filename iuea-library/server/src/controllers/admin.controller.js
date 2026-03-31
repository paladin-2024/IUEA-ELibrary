const { User, Book, UserProgress, ChatSession, Podcast } = require('../models');
const { searchBiblio }     = require('../services/koha.service');
const { syncPodcast }      = require('../services/podcast.service');
const { uploadBookFile, uploadCover, deleteFile } = require('../services/r2.service');

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [users, books, sessions, podcasts, completedBooks, recentUsers, dailyReaders] =
      await Promise.all([
        User.countDocuments(),
        Book.countDocuments({ isActive: true }),
        ChatSession.countDocuments(),
        Podcast.countDocuments({ isActive: true }),
        UserProgress.countDocuments({ isCompleted: true }),
        User.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select('name email faculty role createdAt isActive'),
        UserProgress.aggregate([
          { $match: { lastReadAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id:     { $dateToString: { format: '%m/%d', date: '$lastReadAt' } },
              readers: { $addToSet: '$userId' },
            },
          },
          { $project: { date: '$_id', count: { $size: '$readers' }, _id: 0 } },
          { $sort: { date: 1 } },
        ]),
      ]);

    res.json({
      stats: { users, books, sessions, podcasts, completedBooks },
      recentUsers,
      dailyReaders,
    });
  } catch (err) { next(err); }
};

// ── GET /api/admin/books ──────────────────────────────────────────────────────
const getBooks = async (req, res, next) => {
  try {
    const {
      page     = 1,
      limit    = 30,
      q        = '',
      category = '',
      source   = '',
    } = req.query;

    const filter = {};
    if (q)        filter.$text = { $search: q };
    if (category) filter.category = category;
    if (source === 'koha')      filter.kohaId      = { $exists: true, $ne: null };
    if (source === 'archive')   filter.archiveId   = { $exists: true, $ne: null };
    if (source === 'gutenberg') filter.gutenbergId = { $exists: true, $ne: null };
    if (source === 'upload')    filter.fileUrl     = { $exists: true, $ne: null };

    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * Number(limit))
        .limit(Number(limit)),
      Book.countDocuments(filter),
    ]);

    res.json({ books, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ── POST /api/admin/books ─────────────────────────────────────────────────────
// Handles multer fields: bookFile (required), coverFile (optional)
const uploadBook = async (req, res, next) => {
  try {
    const bookFile  = req.files?.bookFile?.[0];
    const coverFile = req.files?.coverFile?.[0];

    // Parse array fields sent as comma-separated strings from FormData
    const parseArr = (v) => {
      if (Array.isArray(v)) return v;
      if (!v) return [];
      return String(v).split(',').map((s) => s.trim()).filter(Boolean);
    };

    const book = await Book.create({
      title:         req.body.title,
      author:        req.body.author,
      description:   req.body.description  || '',
      category:      req.body.category     || 'General',
      faculty:       parseArr(req.body.faculty),
      tags:          parseArr(req.body.tags),
      languages:     parseArr(req.body.languages) || ['English'],
      publishedYear: req.body.publishedYear ? Number(req.body.publishedYear) : undefined,
      isActive:      true,
    });

    if (bookFile) {
      book.fileUrl    = await uploadBookFile(bookFile, book._id);
      book.fileFormat = bookFile.originalname.split('.').pop().toLowerCase();
    }

    if (coverFile) {
      book.coverUrl = await uploadCover(coverFile.buffer, book._id);
    }

    await book.save();
    res.status(201).json({ book });
  } catch (err) { next(err); }
};

// ── PATCH /api/admin/books/:id ────────────────────────────────────────────────
const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    res.json({ book });
  } catch (err) { next(err); }
};

// ── DELETE /api/admin/books/:id ───────────────────────────────────────────────
// Soft delete: sets isActive = false
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    res.json({ message: 'Book archived.', book });
  } catch (err) { next(err); }
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, q = '', faculty = '' } = req.query;
    const filter = {};
    if (q)       filter.$or = [
      { name:  { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
    if (faculty) filter.faculty = faculty;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * Number(limit))
        .limit(Number(limit))
        .select('-passwordHash'),
      User.countDocuments(filter),
    ]);
    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ── PATCH /api/admin/users/:id/suspend ────────────────────────────────────────
const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({
      user,
      message: user.isActive ? 'User reactivated.' : 'User suspended.',
    });
  } catch (err) { next(err); }
};

// ── GET /api/admin/users/:id ──────────────────────────────────────────────────
const getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const progress = await UserProgress.find({ userId: req.params.id })
      .populate('bookId', 'title author coverUrl fileFormat')
      .sort({ lastReadAt: -1 })
      .limit(20);

    res.json({ user, progress });
  } catch (err) { next(err); }
};

// ── POST /api/admin/sync-koha ─────────────────────────────────────────────────
const syncKoha = async (req, res, next) => {
  try {
    const { q = '', limit = 500 } = req.body;
    const results = await searchBiblio({ q, limit: Number(limit) });
    let synced = 0;

    for (const item of results) {
      if (!item.biblio_id) continue;
      await Book.findOneAndUpdate(
        { kohaId: String(item.biblio_id) },
        {
          $set: {
            kohaId:    String(item.biblio_id),
            title:     item.title   || 'Untitled',
            author:    item.author  || 'Unknown',
            isbn:      item.isbn,
            category:  item.subject || 'General',
            languages: item.language ? [item.language] : ['English'],
            lastSyncedFromKoha: new Date(),
            isActive:  true,
          },
        },
        { upsert: true }
      );
      synced++;
    }

    res.json({ message: `Synced ${synced} book(s) from Koha.`, synced });
  } catch (err) { next(err); }
};

// ── POST /api/admin/sync-patrons ──────────────────────────────────────────────
// Attempts to link IUEA users without kohaPatronId to matching Koha patrons
// by matching on studentId. (Requires Koha patron search API access.)
const syncPatrons = async (req, res, next) => {
  try {
    const unlinked = await User.find({
      kohaPatronId: { $in: [null, undefined, ''] },
      studentId:    { $exists: true, $ne: null },
      isActive:     true,
    }).select('_id studentId email name');

    let linked = 0;

    // Best-effort: attempt to find each student in Koha by their student ID.
    // Koha search may not return patron records via bibliographic search;
    // replace this loop with a patron-specific API call if available.
    for (const user of unlinked) {
      try {
        const results = await searchBiblio({ q: user.studentId, limit: 1 });
        if (results?.[0]?.patron_id) {
          await User.findByIdAndUpdate(user._id, {
            kohaPatronId: String(results[0].patron_id),
          });
          linked++;
        }
      } catch { /* continue to next user */ }
    }

    res.json({
      message: `Linked ${linked} of ${unlinked.length} users to Koha.`,
      linked,
      total:   unlinked.length,
    });
  } catch (err) { next(err); }
};

// ── POST /api/admin/podcasts ──────────────────────────────────────────────────
const addPodcast = async (req, res, next) => {
  try {
    const { rssUrl, category = 'Education', language = 'English' } = req.body;
    if (!rssUrl) return res.status(400).json({ message: 'rssUrl is required.' });

    await syncPodcast({ rssUrl, category, language });
    const podcast = await Podcast.findOne({ rssUrl }).select('-episodes');
    res.status(201).json({ podcast });
  } catch (err) { next(err); }
};

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
const getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);

    const [dailyReads, topBooks, langDist, hourlyActivity, dailySignups] =
      await Promise.all([
        // Daily read sessions — last 30 days
        UserProgress.aggregate([
          { $match: { lastReadAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id:   { $dateToString: { format: '%m/%d', date: '$lastReadAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { date: '$_id', count: 1, _id: 0 } },
        ]),

        // Top 10 most-read books
        UserProgress.aggregate([
          { $group: { _id: '$bookId', sessions: { $sum: 1 } } },
          { $sort: { sessions: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from:         'books',
              localField:   '_id',
              foreignField: '_id',
              as:           'book',
            },
          },
          { $unwind: { path: '$book', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              sessions: 1,
              title:  { $ifNull: ['$book.title',  'Unknown'] },
              author: { $ifNull: ['$book.author', ''] },
            },
          },
        ]),

        // Language distribution across books
        Book.aggregate([
          { $match: { isActive: true } },
          { $unwind: { path: '$languages', preserveNullAndEmptyArrays: false } },
          { $group: { _id: '$languages', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { name: '$_id', value: '$count', _id: 0 } },
        ]),

        // Hourly activity heatmap — last 7 days (day-of-week × hour)
        UserProgress.aggregate([
          { $match: { lastReadAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: {
                day:  { $dayOfWeek: '$lastReadAt' }, // 1=Sun … 7=Sat
                hour: { $hour:      '$lastReadAt' },
              },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              day:   '$_id.day',
              hour:  '$_id.hour',
              count: 1,
              _id:   0,
            },
          },
        ]),

        // Daily new signups — last 30 days
        User.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id:   { $dateToString: { format: '%m/%d', date: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { date: '$_id', count: 1, _id: 0 } },
        ]),
      ]);

    res.json({ dailyReads, topBooks, langDist, hourlyActivity, dailySignups });
  } catch (err) { next(err); }
};

module.exports = {
  getStats,
  getBooks,
  uploadBook,
  updateBook,
  deleteBook,
  getUsers,
  suspendUser,
  getUserDetail,
  syncKoha,
  syncPatrons,
  addPodcast,
  getAnalytics,
};
