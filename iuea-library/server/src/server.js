require('dotenv').config();

const app            = require('./app');
const connectDB      = require('./config/db');
const { initFirebase } = require('./config/firebase');
const cron           = require('node-cron');

// Services used by cron jobs
const { syncAllFeeds }       = require('./services/podcast.service');
const { sendReadingReminder, sendWeeklyDigest: fcmDigest } = require('./services/firebase.service');
const { sendWeeklyDigest: emailDigest } = require('./services/email.service');
const { User, Book, UserProgress } = require('./models');
const { searchBiblio }       = require('./services/koha.service');

const PORT = process.env.PORT || 5000;

// ── Koha catalogue sync ───────────────────────────────────────────────────────
async function syncKohaCatalogue() {
  try {
    console.log('[cron] Starting Koha catalogue sync…');
    const results = await searchBiblio({ q: '', limit: 500 });
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
    console.log(`[cron] Koha sync complete — ${synced} records processed.`);
  } catch (err) {
    console.error('[cron] Koha sync error:', err.message);
  }
}

// ── Main startup ──────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  initFirebase();

  // Serve static uploads in development
  const express = require('express');
  const path    = require('path');
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);

    // ── Run once on startup ────────────────────────────────────────────────
    syncKohaCatalogue();
    syncAllFeeds().catch((e) =>
      console.error('[startup] Podcast sync error:', e.message));
  });

  // ── Every 6 hours — Koha + Podcasts ───────────────────────────────────────
  cron.schedule('0 */6 * * *', () => {
    console.log('[cron] 6-hour sync triggered');
    syncKohaCatalogue();
    syncAllFeeds().catch((e) =>
      console.error('[cron] Podcast sync error:', e.message));
  });

  // ── Daily 7 pm — reading reminders ────────────────────────────────────────
  // Notify users who haven't opened the app today and have a book in progress.
  cron.schedule('0 19 * * *', async () => {
    console.log('[cron] Sending reading reminders…');
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const users     = await User.find({ isActive: true }).select('_id').lean();

      for (const u of users) {
        const progress = await UserProgress
          .findOne({
            userId:      u._id,
            isCompleted: false,
            lastReadAt:  { $lt: yesterday },
          })
          .populate('bookId', 'title')
          .sort({ lastReadAt: -1 });

        if (progress?.bookId?.title) {
          await sendReadingReminder(u._id, progress.bookId.title);
        }
      }
    } catch (err) {
      console.error('[cron] Reading reminder error:', err.message);
    }
  });

  // ── Every Sunday 8 am — weekly digest ─────────────────────────────────────
  cron.schedule('0 8 * * 0', async () => {
    console.log('[cron] Sending weekly digests…');
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const users   = await User.find({ isActive: true }).lean();

      for (const user of users) {
        const progresses = await UserProgress.find({
          userId:     user._id,
          lastReadAt: { $gte: weekAgo },
        }).populate('bookId', 'title');

        const sessions    = progresses.length;
        if (!sessions) continue;

        const booksRead   = progresses.filter((p) => p.isCompleted).length;
        const minutesRead = progresses.reduce(
          (s, p) => s + (p.totalReadingMinutes ?? 0), 0
        );

        // Find top book (most minutes)
        const topProgress = progresses
          .filter((p) => p.bookId?.title)
          .sort((a, b) => (b.totalReadingMinutes ?? 0) - (a.totalReadingMinutes ?? 0))[0];
        const topBook = topProgress?.bookId?.title;

        const stats = { booksRead, minutesRead, sessions, topBook };

        // Fire-and-forget: don't let one failure block the rest
        fcmDigest(user._id, stats).catch(() => {});
        emailDigest(user,   stats).catch(() => {});
      }
    } catch (err) {
      console.error('[cron] Weekly digest error:', err.message);
    }
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
