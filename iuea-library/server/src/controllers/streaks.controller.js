const User = require('../models/User');

const BADGES = {
  first_book:    { id: 'first_book',    label: 'First Chapter',   desc: 'Completed your first book',         xp: 50  },
  streak_3:      { id: 'streak_3',      label: 'On a Roll',       desc: '3-day reading streak',              xp: 30  },
  streak_7:      { id: 'streak_7',      label: 'Week Warrior',    desc: '7-day reading streak',              xp: 100 },
  streak_30:     { id: 'streak_30',     label: 'Reading Machine', desc: '30-day reading streak',             xp: 500 },
  night_owl:     { id: 'night_owl',     label: 'Night Owl',       desc: 'Read between 10pm and 2am',        xp: 20  },
  speed_reader:  { id: 'speed_reader',  label: 'Speed Reader',    desc: 'Read a book in under 24 hours',    xp: 75  },
  polyglot:      { id: 'polyglot',      label: 'Polyglot',        desc: 'Read in 3+ languages',             xp: 150 },
  book_worm:     { id: 'book_worm',     label: 'Book Worm',       desc: 'Read 10 books',                    xp: 200 },
  scholar:       { id: 'scholar',       label: 'Scholar',         desc: 'Read 25 books',                    xp: 500 },
};

// ── GET /api/streaks  (current user streak info) ──────────────────────────────
const getStreak = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('currentStreak longestStreak lastReadDate totalXp badges totalReadingMinutes readingGoal')
      .lean();

    const badgeDetails = (user.badges ?? []).map(id => BADGES[id]).filter(Boolean);
    const allBadges    = Object.values(BADGES).map(b => ({
      ...b,
      earned: (user.badges ?? []).includes(b.id),
    }));

    res.json({
      currentStreak:       user.currentStreak ?? 0,
      longestStreak:       user.longestStreak ?? 0,
      lastReadDate:        user.lastReadDate,
      totalXp:             user.totalXp ?? 0,
      totalReadingMinutes: user.totalReadingMinutes ?? 0,
      readingGoal:         user.readingGoal ?? 20,
      badges:              badgeDetails,
      allBadges,
    });
  } catch (err) { next(err); }
};

// ── Called internally from progress controller after a save ───────────────────
const updateStreak = async (userId, { minutesRead = 0, isCompleted = false, readingLanguage = 'English', hour = new Date().getHours() } = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const now      = new Date();
    const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastRead = user.lastReadDate ? new Date(user.lastReadDate) : null;
    const lastDay  = lastRead ? new Date(lastRead.getFullYear(), lastRead.getMonth(), lastRead.getDate()) : null;

    const diffDays = lastDay ? Math.round((today - lastDay) / (1000 * 60 * 60 * 24)) : null;

    let newStreak = user.currentStreak ?? 0;
    if (diffDays === null || diffDays > 1) {
      newStreak = 1; // reset
    } else if (diffDays === 1) {
      newStreak += 1; // extend
    }
    // diffDays === 0 → same day, keep current

    const longestStreak = Math.max(user.longestStreak ?? 0, newStreak);

    // XP for reading
    let xpGain = Math.floor(minutesRead / 5); // 1 XP per 5 minutes
    if (isCompleted) xpGain += BADGES.first_book.xp;

    // Badge logic
    const earnedBadges = new Set(user.badges ?? []);

    if (newStreak >= 3)  earnedBadges.add('streak_3');
    if (newStreak >= 7)  earnedBadges.add('streak_7');
    if (newStreak >= 30) earnedBadges.add('streak_30');
    if (hour >= 22 || hour <= 2) earnedBadges.add('night_owl');

    // Track total reading minutes on user doc for leaderboard
    const newTotalMinutes = (user.totalReadingMinutes ?? 0) + minutesRead;

    // Multilingual badge — check stored prefs
    const langs = user.preferredLanguages ?? [];
    if (readingLanguage !== 'English' && !langs.includes(readingLanguage)) {
      langs.push(readingLanguage);
      if (langs.length >= 3) earnedBadges.add('polyglot');
      await User.findByIdAndUpdate(userId, { preferredLanguages: langs });
    }

    await User.findByIdAndUpdate(userId, {
      currentStreak:       newStreak,
      longestStreak,
      lastReadDate:        now,
      totalXp:             (user.totalXp ?? 0) + xpGain,
      badges:              [...earnedBadges],
      totalReadingMinutes: newTotalMinutes,
    });
  } catch (err) {
    console.error('[streaks] updateStreak error:', err.message);
  }
};

module.exports = { getStreak, updateStreak, BADGES };
