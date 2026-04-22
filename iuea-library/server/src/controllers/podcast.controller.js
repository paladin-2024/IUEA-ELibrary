const prisma        = require('../config/prisma');
const PodcastModel  = require('../models/Podcast');
const axios         = require('axios');

const toResponse = (p) => ({ ...p, author: p.hostName ?? '' });

// ── Seeded random (deterministic) ────────────────────────────────────────────
function seededNum(seed, max, min = 0) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  return min + (Math.abs(hash) % (max - min));
}

// ── Parse RSS feed for episodes ───────────────────────────────────────────────
async function fetchRssEpisodes(feedUrl, podcastName, publisher, coverImage, category) {
  try {
    const { data: xml } = await axios.get(feedUrl, {
      headers: { 'User-Agent': 'IUEA-Library/2.0' },
      timeout: 6000,
      responseType: 'text',
    });

    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/g) || [];

    return itemMatches.slice(0, 5).map((item, i) => {
      const get = (tag) => {
        const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return (m?.[1] || m?.[2] || '').trim();
      };

      const enclosure = item.match(/<enclosure[^>]+url="([^"]+)"[^>]*>/);
      const audioUrl  = enclosure?.[1] || '';

      const durationRaw = get('itunes:duration');
      let durationSecs = 0;
      if (durationRaw.includes(':')) {
        const parts = durationRaw.split(':').map(Number);
        durationSecs = parts.length === 3
          ? parts[0] * 3600 + parts[1] * 60 + parts[2]
          : parts[0] * 60 + parts[1];
      } else {
        durationSecs = parseInt(durationRaw) || seededNum(podcastName + i, 3600, 600);
      }

      const episodeImage = item.match(/<itunes:image[^>]+href="([^"]+)"/)?.[1] || coverImage;
      const pubDate      = get('pubDate');
      const epNum        = get('itunes:episode');
      const title        = get('title') || `${podcastName} — Episode ${i + 1}`;
      const id           = `${feedUrl}-${i}`.replace(/[^a-z0-9]/gi, '').slice(0, 32);

      return {
        id,
        title,
        author:    get('itunes:author') || publisher,
        hostName:  get('itunes:author') || publisher,
        description: get('description') || get('itunes:summary') || '',
        coverUrl:  episodeImage,
        audioUrl,
        duration:  durationSecs,
        durationFormatted: `${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, '0')}`,
        category,
        plays:    seededNum(id + 'plays', 80000, 500),
        featured: i === 0,
        episodeNumber: epNum ? parseInt(epNum) : undefined,
        series:   podcastName,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        isExternal: true,
      };
    }).filter((ep) => ep.audioUrl);
  } catch {
    return [];
  }
}

// ── Fetch live podcasts from iTunes + RSS ─────────────────────────────────────
async function fetchLivePodcasts(term, category) {
  try {
    const { data } = await axios.get('https://itunes.apple.com/search', {
      params: { term, media: 'podcast', entity: 'podcast', limit: 12, lang: 'en_us' },
      timeout: 8000,
    });

    const results = data.results || [];
    if (!results.length) return { episodes: [], categories: ['All'] };

    const top  = results.slice(0, 8);
    const batches = await Promise.all(
      top.map((p) => {
        const cat = category !== 'All' ? category : (p.primaryGenreName || 'Education');
        return fetchRssEpisodes(p.feedUrl, p.collectionName, p.artistName, p.artworkUrl600 || p.artworkUrl100, cat);
      })
    );

    const allEpisodes = batches.flat();
    const rawCats     = top.map((p) => p.primaryGenreName).filter(Boolean);
    const categories  = ['All', ...Array.from(new Set(rawCats)).slice(0, 8)];

    const filtered = category && category !== 'All'
      ? allEpisodes.filter((ep) =>
          ep.category === category || ep.series?.toLowerCase().includes(category.toLowerCase()))
      : allEpisodes;

    return { episodes: (filtered.length ? filtered : allEpisodes).slice(0, 30), categories };
  } catch {
    return { episodes: [], categories: ['All'] };
  }
}

// GET /api/podcasts
const listPodcasts = async (req, res, next) => {
  try {
    const { category, language, q, page = 1, limit = 30 } = req.query;
    const where = { isActive: true };
    if (category && category !== 'All') where.category = category;
    if (language) where.language = language;

    // 1. DB podcasts
    const [dbPodcasts] = await Promise.all([
      prisma.podcast.findMany({
        where,
        orderBy: [{ subscriberCount: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * Number(limit),
        take: Number(limit),
      }),
    ]);

    // 2. Live iTunes + RSS — always run to supplement empty DB
    const CATEGORY_TERMS = {
      Technology: 'technology education',
      Science: 'science education',
      Business: 'business economics',
      History: 'history africa',
      Literature: 'literature books',
      Philosophy: 'philosophy',
      Psychology: 'psychology',
      Mathematics: 'mathematics',
      Education: 'education academic',
    };
    const term = q || (category && category !== 'All' ? CATEGORY_TERMS[category] || category : 'education academic university');
    const { episodes: liveEpisodes, categories } = await fetchLivePodcasts(term, category || 'All');

    // 3. Merge: DB first, then live (dedupe by title)
    const dbTitles = new Set(dbPodcasts.map((p) => p.title?.toLowerCase()));
    const merged   = [
      ...dbPodcasts.map(toResponse),
      ...liveEpisodes.filter((ep) => !dbTitles.has(ep.title?.toLowerCase())),
    ];

    res.json({ podcasts: merged, total: merged.length, categories, page: Number(page), pages: 1 });
  } catch (err) { next(err); }
};

// GET /api/podcasts/category/:cat
const getByCategory = async (req, res, next) => {
  try {
    const podcasts = await prisma.podcast.findMany({
      where:   { category: req.params.cat, isActive: true },
      orderBy: { subscriberCount: 'desc' },
      select: {
        id: true, title: true, description: true, hostName: true,
        coverUrl: true, rssUrl: true, category: true, language: true,
        subscriberCount: true, isActive: true, createdAt: true, updatedAt: true,
      },
    });
    res.json({ podcasts: podcasts.map(toResponse) });
  } catch (err) { next(err); }
};

// GET /api/podcasts/:id
const getPodcast = async (req, res, next) => {
  try {
    const podcast = await prisma.podcast.findUnique({ where: { id: req.params.id } });
    if (!podcast) return res.status(404).json({ message: 'Podcast not found.' });
    res.json({ podcast: toResponse(podcast) });
  } catch (err) { next(err); }
};

// POST /api/podcasts/subscribe/:id
const subscribe = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const podcastId      = req.params.id;

    const podcast = await PodcastModel.findByIdAndUpdate(
      podcastId,
      { $addToSet: { subscribers: userId } },
      { new: true },
    );
    if (!podcast) return res.status(404).json({ message: 'Podcast not found.' });

    const count = podcast.subscribers.length;
    await PodcastModel.findByIdAndUpdate(podcastId, { subscriberCount: count });

    res.json({ subscribed: true, subscriberCount: count });
  } catch (err) { next(err); }
};

// DELETE /api/podcasts/subscribe/:id
const unsubscribe = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const podcastId      = req.params.id;

    const podcast = await PodcastModel.findByIdAndUpdate(
      podcastId,
      { $pull: { subscribers: userId } },
      { new: true },
    );
    if (!podcast) return res.status(404).json({ message: 'Podcast not found.' });

    const count = podcast.subscribers.length;
    await PodcastModel.findByIdAndUpdate(podcastId, { subscriberCount: count });

    res.json({ subscribed: false, subscriberCount: count });
  } catch (err) { next(err); }
};

// GET /api/podcasts/subscriptions
const getSubscriptions = async (req, res, next) => {
  try {
    const podcasts = await PodcastModel.find({ subscribers: req.user.id, isActive: true }).lean();
    res.json({ podcasts: podcasts.map(toResponse) });
  } catch (err) { next(err); }
};

// POST /api/podcasts/:id/play
const trackPlay = async (req, res, next) => {
  try {
    const podcast = await prisma.podcast.findUnique({ where: { id: req.params.id } });
    if (!podcast) return res.status(404).json({ message: 'Podcast not found.' });

    const updated = await prisma.podcast.update({
      where: { id: req.params.id },
      data:  { playCount: { increment: 1 } },
      select: { id: true, playCount: true },
    });
    res.json({ playCount: updated.playCount });
  } catch (err) { next(err); }
};

module.exports = { listPodcasts, getByCategory, getPodcast, subscribe, unsubscribe, getSubscriptions, trackPlay };
