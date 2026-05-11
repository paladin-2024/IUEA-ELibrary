const prisma        = require('../config/prisma');
const { syncPodcast }  = require('../services/podcast.service');
const { uploadBookFile, uploadCover } = require('../services/r2.service');
const { sendMulticast, sendNewBookNotification } = require('../services/firebase.service');


// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const todayStart    = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [users, books, sessions, podcastPlayCount, downloadsToday, completedBooks, recentUsers] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.book.count({ where: { isActive: true } }),
      prisma.chatSession.count(),
      prisma.podcast.aggregate({ _sum: { playCount: true }, where: { isActive: true } }),
      prisma.userProgress.count({ where: { isDownloaded: true, updatedAt: { gte: todayStart } } }),
      prisma.userProgress.count({ where: { isCompleted: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take:    10,
        select:  { id: true, name: true, email: true, faculty: true, role: true, createdAt: true, isActive: true },
      }),
    ]);

    const podcastPlays = podcastPlayCount._sum.playCount ?? 0;

    const dailyReaders = await prisma.$queryRaw`
      SELECT TO_CHAR(DATE("lastReadAt"), 'MM/DD') AS date,
             COUNT(DISTINCT "userId")::integer    AS count
      FROM   "UserProgress"
      WHERE  "lastReadAt" >= ${thirtyDaysAgo}
      GROUP  BY DATE("lastReadAt")
      ORDER  BY DATE("lastReadAt")
    `;

    res.json({
      stats: { users, books, sessions, downloadsToday, podcastPlays, completedBooks },
      recentUsers,
      dailyReaders,
    });
  } catch (err) { next(err); }
};

// GET /api/admin/books
const getBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, q = '', category = '', source = '' } = req.query;
    const where = {};
    if (q)        { where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { author: { contains: q, mode: 'insensitive' } }]; }
    if (category) where.category  = category;
    if (source === 'archive')   where.archiveId = { not: null };
    if (source === 'gutenberg') where.gutenbergId = { not: null };
    if (source === 'upload')    where.fileUrl   = { not: null };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.book.count({ where }),
    ]);

    res.json({ books, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// POST /api/admin/books
const uploadBook = async (req, res, next) => {
  try {
    const bookFile  = req.files?.bookFile?.[0];
    const coverFile = req.files?.coverFile?.[0];

    const parseArr = (v) => {
      if (Array.isArray(v)) return v;
      if (!v) return [];
      return String(v).split(',').map((s) => s.trim()).filter(Boolean);
    };

    let book = await prisma.book.create({
      data: {
        title:         req.body.title,
        author:        req.body.author,
        description:   req.body.description  || '',
        category:      req.body.category     || 'General',
        faculty:       parseArr(req.body.faculty),
        tags:          parseArr(req.body.tags),
        languages:     parseArr(req.body.languages).length ? parseArr(req.body.languages) : ['English'],
        publishedYear: req.body.publishedYear ? Number(req.body.publishedYear) : null,
        isActive:      true,
      },
    });

    const updates = {};
    if (bookFile) {
      const ext          = bookFile.originalname.split('.').pop().toLowerCase();
      updates.fileUrl    = await uploadBookFile(bookFile, book.id);
      updates.fileKey    = `books/${book.id}.${ext}`;
      updates.fileFormat = ext;
    }
    if (coverFile) {
      updates.coverUrl = await uploadCover(coverFile.buffer, book.id);
    }
    if (Object.keys(updates).length) {
      book = await prisma.book.update({ where: { id: book.id }, data: updates });
    }

    res.status(201).json({ book });
    // Fire-and-forget — don't await so it doesn't delay the response
    sendNewBookNotification(book).catch(() => {});
  } catch (err) { next(err); }
};

// PATCH /api/admin/books/:id
const updateBook = async (req, res, next) => {
  try {
    const ALLOWED = [
      'title', 'author', 'description', 'category', 'faculty', 'tags',
      'languages', 'publishedYear', 'pageCount', 'coverUrl', 'fileUrl',
      'fileFormat', 'isbn', 'isActive', 'rating', 'ratingCount',
    ];
    const data = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (!Object.keys(data).length)
      return res.status(400).json({ message: 'No updatable fields provided.' });

    const book = await prisma.book.update({ where: { id: req.params.id }, data });
    res.json({ book });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Book not found.' });
    next(err);
  }
};

// DELETE /api/admin/books/:id  (soft delete)
const deleteBook = async (req, res, next) => {
  try {
    const book = await prisma.book.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Book archived.', book });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Book not found.' });
    next(err);
  }
};

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, q = '', faculty = '' } = req.query;
    const where = {};
    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }];
    if (faculty) where.faculty = faculty;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * Number(limit),
        take:    Number(limit),
        select: {
          id: true, name: true, email: true, studentId: true, faculty: true,
          role: true, avatar: true, isActive: true, createdAt: true, updatedAt: true,
          preferredLanguages: true, readingGoal: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/suspend
const suspendUser = async (req, res, next) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'User not found.' });
    const user = await prisma.user.update({
      where:  { id: req.params.id },
      data:   { isActive: !existing.isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });
    res.json({ user, message: user.isActive ? 'User reactivated.' : 'User suspended.' });
  } catch (err) { next(err); }
};

// GET /api/admin/users/:id
const getUserDetail = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.params.id },
      select: { id: true, name: true, email: true, faculty: true, role: true, isActive: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const progress = await prisma.userProgress.findMany({
      where:   { userId: req.params.id },
      orderBy: { lastReadAt: 'desc' },
      take:    20,
      include: { book: { select: { title: true, author: true, coverUrl: true, fileFormat: true } } },
    });

    res.json({ user, progress });
  } catch (err) { next(err); }
};

// POST /api/admin/sync-patrons  (repurposed: refresh all podcast RSS feeds)
const syncPatrons = async (req, res, next) => {
  try {
    const { syncAllFeeds } = require('../services/podcast.service');
    await syncAllFeeds();
    res.json({ message: 'Podcast RSS feeds refreshed successfully.' });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where:  { id: req.params.id },
      data:   { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ user });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'User not found.' });
    next(err);
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'User not found.' });

    await Promise.all([
      prisma.userProgress.deleteMany({ where: { userId: req.params.id } }),
      prisma.chatSession.deleteMany({ where: { userId: req.params.id } }),
      prisma.borrowRequest.deleteMany({ where: { userId: req.params.id } }),
      prisma.review.deleteMany({ where: { userId: req.params.id } }),
      prisma.collection.deleteMany({ where: { userId: req.params.id } }),
    ]);
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted.' });
  } catch (err) { next(err); }
};

// PATCH /api/admin/books/:id/toggle
const toggleBookStatus = async (req, res, next) => {
  try {
    const existing = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Book not found.' });
    const book = await prisma.book.update({
      where: { id: req.params.id },
      data:  { isActive: !existing.isActive },
    });
    res.json({ book, message: book.isActive ? 'Book activated.' : 'Book deactivated.' });
  } catch (err) { next(err); }
};

// GET /api/admin/analytics/top-books
const getTopBooks = async (req, res, next) => {
  try {
    const topBooks = await prisma.$queryRaw`
      SELECT up."bookId",
             COUNT(*)::integer          AS sessions,
             COALESCE(b.title,  'Unknown') AS title,
             COALESCE(b.author, 'Unknown') AS author
      FROM   "UserProgress" up
      LEFT JOIN "Book" b ON b.id = up."bookId"
      GROUP  BY up."bookId", b.title, b.author
      ORDER  BY sessions DESC
      LIMIT  10
    `;
    res.json({ topBooks });
  } catch (err) { next(err); }
};

// GET /api/admin/analytics/user-growth
const getUserGrowth = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailySignups = await prisma.$queryRaw`
      SELECT TO_CHAR(DATE("createdAt"), 'MM/DD') AS date,
             COUNT(*)::integer                   AS count
      FROM   "User"
      WHERE  "createdAt" >= ${thirtyDaysAgo}
      GROUP  BY DATE("createdAt")
      ORDER  BY DATE("createdAt")
    `;
    res.json({ dailySignups });
  } catch (err) { next(err); }
};

// POST /api/admin/notifications/push
const sendPushNotification = async (req, res, next) => {
  try {
    const { title, body, targetRole, data = {} } = req.body;

    const where = targetRole ? { role: targetRole, isActive: true } : { isActive: true };
    const users  = await prisma.user.findMany({
      where,
      select: { fcmToken: true, fcmTokenMobile: true, fcmTokenWeb: true },
    });

    const tokens = [
      ...new Set(
        users.flatMap(u => [u.fcmToken, u.fcmTokenMobile, u.fcmTokenWeb].filter(Boolean))
      ),
    ];

    if (tokens.length) {
      await sendMulticast({ tokens, title, body, data });
    }

    res.json({ message: `Notification sent to ${tokens.length} device(s).`, sent: tokens.length });
  } catch (err) { next(err); }
};

// POST /api/admin/podcasts
const addPodcast = async (req, res, next) => {
  try {
    const { rssUrl, category = 'Education', language = 'English' } = req.body;
    if (!rssUrl) return res.status(400).json({ message: 'rssUrl is required.' });
    await syncPodcast({ rssUrl, category, language });
    const podcast = await prisma.podcast.findFirst({ where: { rssUrl } });
    res.status(201).json({ podcast });
  } catch (err) { next(err); }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);

    const [dailyReads, topBooksRaw, langDist, hourlyActivity, dailySignups] = await Promise.all([
      // Daily read sessions over last 30 days
      prisma.$queryRaw`
        SELECT TO_CHAR(DATE("lastReadAt"), 'MM/DD') AS date,
               COUNT(*)::integer                   AS count
        FROM   "UserProgress"
        WHERE  "lastReadAt" >= ${thirtyDaysAgo}
        GROUP  BY DATE("lastReadAt")
        ORDER  BY DATE("lastReadAt")
      `,
      // Top 10 most-read books
      prisma.$queryRaw`
        SELECT up."bookId",
               COUNT(*)::integer             AS sessions,
               COALESCE(b.title,  'Unknown') AS title,
               COALESCE(b.author, 'Unknown') AS author
        FROM   "UserProgress" up
        LEFT JOIN "Book" b ON b.id = up."bookId"
        GROUP  BY up."bookId", b.title, b.author
        ORDER  BY sessions DESC
        LIMIT  10
      `,
      // Language distribution from active books (unnest array)
      prisma.$queryRaw`
        SELECT lang AS name, COUNT(*)::integer AS value
        FROM   "Book", UNNEST(languages) AS lang
        WHERE  "isActive" = true
        GROUP  BY lang
        ORDER  BY value DESC
      `,
      // Hourly activity heatmap over last 7 days (0=Sun … 6=Sat)
      prisma.$queryRaw`
        SELECT EXTRACT(DOW  FROM "lastReadAt")::integer  AS day,
               EXTRACT(HOUR FROM "lastReadAt")::integer  AS hour,
               COUNT(*)::integer                         AS count
        FROM   "UserProgress"
        WHERE  "lastReadAt" >= ${sevenDaysAgo}
        GROUP  BY day, hour
      `,
      // Daily signups over last 30 days
      prisma.$queryRaw`
        SELECT TO_CHAR(DATE("createdAt"), 'MM/DD') AS date,
               COUNT(*)::integer                   AS count
        FROM   "User"
        WHERE  "createdAt" >= ${thirtyDaysAgo}
        GROUP  BY DATE("createdAt")
        ORDER  BY DATE("createdAt")
      `,
    ]);

    res.json({ dailyReads, topBooks: topBooksRaw, langDist, hourlyActivity, dailySignups });
  } catch (err) { next(err); }
};

// GET /api/admin/podcasts
const getPodcasts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 30 } = req.query;
    const where = {};
    if (q) where.title = { contains: q, mode: 'insensitive' };

    const [total, podcasts] = await Promise.all([
      prisma.podcast.count({ where }),
      prisma.podcast.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
    ]);
    res.json({ podcasts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

// PATCH /api/admin/podcasts/:id
const updatePodcast = async (req, res, next) => {
  try {
    const { title, description, category, language } = req.body;
    const podcast = await prisma.podcast.update({
      where: { id: req.params.id },
      data:  { ...(title && { title }), ...(description && { description }), ...(category && { category }), ...(language && { language }) },
    });
    res.json({ podcast });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Podcast not found.' });
    next(err);
  }
};

// DELETE /api/admin/podcasts/:id
const deletePodcast = async (req, res, next) => {
  try {
    await prisma.podcast.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Podcast archived.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Podcast not found.' });
    next(err);
  }
};

// GET /api/admin/books/discover?q=...&source=gutenberg|archive|openlibrary
const discoverBooks = async (req, res, next) => {
  try {
    const { q = 'academic', source = 'gutenberg' } = req.query;
    const archiveService  = require('../services/archive.service');
    const { searchOpenLibrary } = require('../services/openlibrary.service');

    let results = [];
    if (source === 'gutenberg') {
      results = await archiveService.searchGutenberg(q);
    } else if (source === 'archive') {
      results = await archiveService.searchArchive(q);
    } else if (source === 'openlibrary') {
      results = await searchOpenLibrary(q, { limit: 20 });
    }

    // Mark which ones are already in DB
    const existingGutenbergIds = results
      .filter((b) => b.gutenbergId)
      .map((b) => b.gutenbergId);

    const inDb = await prisma.book.findMany({
      where:  { gutenbergId: { in: existingGutenbergIds } },
      select: { gutenbergId: true },
    });
    const inDbSet = new Set(inDb.map((b) => b.gutenbergId));

    const annotated = results.map((b) => ({
      ...b,
      alreadyImported: inDbSet.has(b.gutenbergId),
    }));

    res.json({ books: annotated, total: annotated.length });
  } catch (err) { next(err); }
};

// POST /api/admin/books/import  — import a single external book into DB
const importBook = async (req, res, next) => {
  try {
    const { title, author, description, coverUrl, fileUrl, fileFormat,
            category, faculty, languages, gutenbergId, archiveId,
            publishedYear, pageCount, rating, ratingCount } = req.body;

    if (!title || !author) return res.status(400).json({ message: 'title and author are required.' });

    const parseArr = (v) => {
      if (Array.isArray(v)) return v;
      if (!v) return [];
      return String(v).split(',').map((s) => s.trim()).filter(Boolean);
    };

    const data = {
      title,
      author,
      description:  description  || '',
      coverUrl:     coverUrl     || null,
      fileUrl:      fileUrl      || null,
      fileFormat:   fileFormat   || null,
      category:     category     || 'General',
      faculty:      parseArr(faculty),
      languages:    parseArr(languages).length ? parseArr(languages) : ['English'],
      publishedYear: publishedYear ? Number(publishedYear) : null,
      pageCount:    pageCount    ? Number(pageCount)    : null,
      rating:       rating       ? Number(rating)       : 0,
      ratingCount:  ratingCount  ? Number(ratingCount)  : 0,
      isActive:     true,
    };

    if (gutenbergId) data.gutenbergId = Number(gutenbergId);
    if (archiveId)   data.archiveId   = archiveId;

    const where = gutenbergId
      ? { gutenbergId: Number(gutenbergId) }
      : archiveId
        ? { archiveId }
        : null;

    let book;
    if (where) {
      book = await prisma.book.upsert({ where, update: data, create: data });
    } else {
      book = await prisma.book.create({ data });
    }

    res.status(201).json({ book });
    sendNewBookNotification(book).catch(() => {});
  } catch (err) { next(err); }
};

module.exports = {
  getStats, getBooks, uploadBook, updateBook, deleteBook, toggleBookStatus,
  discoverBooks, importBook,
  getUsers, suspendUser, getUserDetail, updateUserRole, deleteUser,
  syncPatrons, getPodcasts, addPodcast, updatePodcast, deletePodcast, getAnalytics,
  getTopBooks, getUserGrowth, sendPushNotification,
};
