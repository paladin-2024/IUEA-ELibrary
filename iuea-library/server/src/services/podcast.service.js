const RSSParser = require('rss-parser');
const cron      = require('node-cron');
const prisma    = require('../config/prisma');

const parser = new RSSParser({
  customFields: {
    feed: [['itunes:author', 'itunesAuthor'], ['itunes:image', 'itunesImage']],
    item: [['itunes:duration', 'itunesDuration']],
  },
});

// ── 5 seed academic podcasts ──────────────────────────────────────────────────
const SEED_FEEDS = [
  {
    rssUrl:   'https://feeds.feedburner.com/TEDTalks_audio',
    category: 'Education',
    language: 'English',
  },
  {
    rssUrl:   'https://www.sciencemag.org/rss/podcast.xml',
    category: 'Science',
    language: 'English',
  },
  {
    rssUrl:   'https://newbooksnetwork.com/new-books-in-literature/feed',
    category: 'Literature',
    language: 'English',
  },
  {
    rssUrl:   'https://feeds.harvardbusiness.org/harvardbusiness/ideacast',
    category: 'Technology',
    language: 'English',
  },
  {
    rssUrl:   'https://feed.podbean.com/lawfarepodcast/feed.xml',
    category: 'Law',
    language: 'English',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDurationSecs(raw) {
  if (!raw) return 0;
  const parts = String(raw).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60  + parts[1];
  return Number(raw) || 0;
}

async function parseFeed(rssUrl) {
  const feed = await parser.parseURL(rssUrl);
  return {
    title:       feed.title          ?? 'Unknown Podcast',
    description: feed.description    ?? '',
    hostName:    feed.itunesAuthor   ?? feed.managingEditor ?? feed.author ?? '',
    coverUrl:    feed.itunesImage?.$ ?.href ?? feed.image?.url ?? '',
    language:    feed.language       ?? 'en',
    episodes: (feed.items ?? []).slice(0, 50)
      .map((item) => ({
        title:       item.title       ?? '',
        description: item.contentSnippet ?? item.summary ?? '',
        audioUrl:    item.enclosure?.url ?? '',
        duration:    parseDurationSecs(item.itunesDuration),
        publishDate: item.pubDate ? new Date(item.pubDate) : undefined,
      }))
      .filter((e) => Boolean(e.audioUrl)),
  };
}

// ── syncPodcast — parse + upsert one feed ─────────────────────────────────────
async function syncPodcast({ rssUrl, category, language }) {
  try {
    const feedData = await parseFeed(rssUrl);
    await prisma.podcast.upsert({
      where:  { rssUrl },
      update: {
        title:       feedData.title,
        description: feedData.description,
        hostName:    feedData.hostName,
        coverUrl:    feedData.coverUrl,
        category:    category ?? 'Education',
        language:    language ?? 'English',
        episodes:    feedData.episodes,
        lastFetched: new Date(),
        isActive:    true,
      },
      create: {
        rssUrl,
        title:           feedData.title,
        description:     feedData.description,
        hostName:        feedData.hostName,
        coverUrl:        feedData.coverUrl,
        category:        category ?? 'Education',
        language:        language ?? 'English',
        episodes:        feedData.episodes,
        lastFetched:     new Date(),
        isActive:        true,
        subscriberCount: 0,
      },
    });
    console.log(`[podcast.service] Synced: ${feedData.title}`);
  } catch (err) {
    console.error(`[podcast.service] Failed to sync ${rssUrl}:`, err.message);
  }
}

// ── syncAllFeeds — refresh every active podcast in DB ─────────────────────────
async function syncAllFeeds() {
  const podcasts = await prisma.podcast.findMany({
    where:  { isActive: true },
    select: { rssUrl: true, category: true, language: true },
  });
  console.log(`[podcast.service] Syncing ${podcasts.length} feeds…`);
  await Promise.allSettled(
    podcasts.map((p) => syncPodcast({
      rssUrl:   p.rssUrl,
      category: p.category,
      language: p.language,
    }))
  );
  console.log('[podcast.service] Sync complete.');
}

// ── seedPodcasts — run once on first startup ──────────────────────────────────
async function seedPodcasts() {
  const count = await prisma.podcast.count();
  if (count > 0) return;

  console.log('[podcast.service] Seeding initial podcasts…');
  await Promise.allSettled(SEED_FEEDS.map(syncPodcast));
  console.log('[podcast.service] Seed complete.');
}

// ── startCronSync — schedule every 6 hours ────────────────────────────────────
function startCronSync() {
  cron.schedule('0 */6 * * *', () => {
    console.log('[podcast.service] Running scheduled RSS sync…');
    syncAllFeeds().catch((e) =>
      console.error('[podcast.service] Cron sync error:', e.message));
  });
  console.log('[podcast.service] Cron sync scheduled every 6 hours.');
}

module.exports = { seedPodcasts, startCronSync, syncAllFeeds, syncPodcast };
