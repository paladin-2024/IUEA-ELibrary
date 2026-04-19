require('dotenv').config();

const app              = require('./app');
const connectDB        = require('./config/db');
const prisma           = require('./config/prisma');
const { initFirebase } = require('./config/firebase');
const cron             = require('node-cron');

const { syncAllFeeds }                       = require('./services/podcast.service');
const { sendReadingReminder, sendWeeklyDigest: fcmDigest } = require('./services/firebase.service');
const { sendWeeklyDigest: emailDigest }      = require('./services/email.service');
const { searchBooks }                        = require('./services/koha.service');

const PORT = process.env.PORT || 5000;

// ── Koha catalogue sync ───────────────────────────────────────────────────────
async function syncKohaCatalogue() {
  try {
    console.log('[cron] Starting Koha catalogue sync…');
    const results = await searchBooks({ q: '', limit: 500 });
    let synced = 0;
    for (const item of results) {
      if (!item.biblio_id) continue;
      await prisma.book.upsert({
        where:  { kohaId: String(item.biblio_id) },
        update: {
          title:    item.title   || 'Untitled',
          author:   item.author  || 'Unknown',
          isbn:     item.isbn    || null,
          category: item.subject || 'General',
          languages: item.language ? [item.language] : ['English'],
          lastSyncedFromKoha: new Date(),
          isActive: true,
        },
        create: {
          kohaId:   String(item.biblio_id),
          title:    item.title   || 'Untitled',
          author:   item.author  || 'Unknown',
          isbn:     item.isbn    || null,
          category: item.subject || 'General',
          languages: item.language ? [item.language] : ['English'],
          lastSyncedFromKoha: new Date(),
          isActive: true,
        },
      });
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

  const express = require('express');
  const path    = require('path');
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);

    syncKohaCatalogue();
    syncAllFeeds().catch((e) => console.error('[startup] Podcast sync error:', e.message));
  });

  // Every 6 hours
  cron.schedule('0 */6 * * *', () => {
    syncKohaCatalogue();
    syncAllFeeds().catch((e) => console.error('[cron] Podcast sync error:', e.message));
  });

  // Daily 7 pm — reading reminders
  cron.schedule('0 19 * * *', async () => {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
      for (const u of users) {
        const progress = await prisma.userProgress.findFirst({
          where:   { userId: u.id, isCompleted: false, lastReadAt: { lt: yesterday } },
          orderBy: { lastReadAt: 'desc' },
          include: { book: { select: { title: true } } },
        });
        if (progress?.book?.title) {
          await sendReadingReminder(u.id, progress.book.title);
        }
      }
    } catch (err) {
      console.error('[cron] Reading reminder error:', err.message);
    }
  });

  // Every Sunday 8 am — weekly digest
  cron.schedule('0 8 * * 0', async () => {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const users   = await prisma.user.findMany({ where: { isActive: true } });
      for (const user of users) {
        const progresses = await prisma.userProgress.findMany({
          where:   { userId: user.id, lastReadAt: { gte: weekAgo } },
          include: { book: { select: { title: true } } },
        });
        if (!progresses.length) continue;

        const booksRead   = progresses.filter((p) => p.isCompleted).length;
        const minutesRead = progresses.reduce((s, p) => s + (p.totalReadingMinutes ?? 0), 0);
        const topProgress = progresses
          .filter((p) => p.book?.title)
          .sort((a, b) => (b.totalReadingMinutes ?? 0) - (a.totalReadingMinutes ?? 0))[0];

        const stats = { booksRead, minutesRead, sessions: progresses.length, topBook: topProgress?.book?.title };
        fcmDigest(user.id, stats).catch(() => {});
        emailDigest(user,   stats).catch(() => {});
      }
    } catch (err) {
      console.error('[cron] Weekly digest error:', err.message);
    }
  });
};

// Graceful shutdown
process.on('SIGINT',  async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
