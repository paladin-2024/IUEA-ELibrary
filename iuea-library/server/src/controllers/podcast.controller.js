const { Podcast } = require('../models');

// Transform: add `author` alias for `hostName` — consumed by Flutter + React
const toResponse = (p) => {
  const obj = p.toJSON ? p.toJSON() : { ...p };
  return { ...obj, author: obj.hostName ?? '' };
};

// GET /
const listPodcasts = async (req, res, next) => {
  try {
    const { category, language, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (language) filter.language = language;

    const [podcasts, total] = await Promise.all([
      Podcast.find(filter)
        .select('-episodes')
        .sort({ subscriberCount: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Podcast.countDocuments(filter),
    ]);

    res.json({
      podcasts: podcasts.map(toResponse),
      total,
      page:  Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) { next(err); }
};

// GET /category/:cat
const getByCategory = async (req, res, next) => {
  try {
    const podcasts = await Podcast.find({
      category: req.params.cat,
      isActive: true,
    }).select('-episodes').sort({ subscriberCount: -1 });

    res.json({ podcasts: podcasts.map(toResponse) });
  } catch (err) { next(err); }
};

// GET /:id
const getPodcast = async (req, res, next) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) return res.status(404).json({ message: 'Podcast not found.' });
    res.json({ podcast: toResponse(podcast) });
  } catch (err) { next(err); }
};

// POST /subscribe/:id
const subscribe = async (req, res, next) => {
  try {
    const userId  = req.user._id;
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) return res.status(404).json({ message: 'Podcast not found.' });

    if (!podcast.subscribers.some((s) => s.equals(userId))) {
      podcast.subscribers.push(userId);
      podcast.subscriberCount = podcast.subscribers.length;
      await podcast.save();
    }

    res.json({ subscribed: true, subscriberCount: podcast.subscriberCount });
  } catch (err) { next(err); }
};

// DELETE /subscribe/:id
const unsubscribe = async (req, res, next) => {
  try {
    const userId  = req.user._id;
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) return res.status(404).json({ message: 'Podcast not found.' });

    podcast.subscribers.pull(userId);
    podcast.subscriberCount = podcast.subscribers.length;
    await podcast.save();

    res.json({ subscribed: false, subscriberCount: podcast.subscriberCount });
  } catch (err) { next(err); }
};

// GET /subscriptions
const getSubscriptions = async (req, res, next) => {
  try {
    const podcasts = await Podcast.find({
      subscribers: req.user._id,
      isActive:    true,
    }).select('-episodes').sort({ updatedAt: -1 });

    res.json({ podcasts: podcasts.map(toResponse) });
  } catch (err) { next(err); }
};

module.exports = { listPodcasts, getByCategory, getPodcast, subscribe, unsubscribe, getSubscriptions };
