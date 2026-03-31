const { Podcast } = require('../models');

// GET /api/podcasts
const listPodcasts = async (req, res, next) => {
  try {
    const { category, language, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (language)  filter.language = language;

    const [podcasts, total] = await Promise.all([
      Podcast.find(filter)
        .select('-episodes')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Podcast.countDocuments(filter),
    ]);
    res.json({ podcasts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/podcasts/:id
const getPodcast = async (req, res, next) => {
  try {
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) return res.status(404).json({ message: 'Podcast not found.' });
    res.json({ podcast });
  } catch (err) {
    next(err);
  }
};

// POST /api/podcasts/subscribe/:id
const toggleSubscribe = async (req, res, next) => {
  try {
    const podcast  = await Podcast.findById(req.params.id);
    if (!podcast) return res.status(404).json({ message: 'Podcast not found.' });

    const userId   = req.user._id;
    const isSubbed = podcast.subscribers.some((s) => s.equals(userId));

    if (isSubbed) {
      podcast.subscribers.pull(userId);
    } else {
      podcast.subscribers.push(userId);
    }
    await podcast.save();

    res.json({ subscribed: !isSubbed, subscriberCount: podcast.subscribers.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { listPodcasts, getPodcast, toggleSubscribe };
