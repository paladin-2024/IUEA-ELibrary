const { getMessaging } = require('../config/firebase');
const { User }         = require('../models');

// ── Stringify all data values (FCM requires string values) ────────────────────
const stringifyData = (data = {}) =>
  Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));

// ── sendPushNotification ──────────────────────────────────────────────────────
// Single-token send (kept for backwards compatibility).
const sendPushNotification = async ({ token, title, body, data = {} }) => {
  if (!token) return null;
  try {
    return await getMessaging().send({
      token,
      notification: { title, body },
      data:         stringifyData(data),
      android:      { priority: 'high' },
      apns:         { payload: { aps: { sound: 'default' } } },
    });
  } catch (err) {
    console.error('[firebase] sendPushNotification error:', err.message);
    return null;
  }
};

// ── sendMulticast ─────────────────────────────────────────────────────────────
// Send to multiple tokens at once.
const sendMulticast = async ({ tokens, title, body, data = {} }) => {
  if (!tokens?.length) return null;
  try {
    return await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data:         stringifyData(data),
      android:      { priority: 'high' },
      apns:         { payload: { aps: { sound: 'default' } } },
    });
  } catch (err) {
    console.error('[firebase] sendMulticast error:', err.message);
    return null;
  }
};

// ── sendToUser ────────────────────────────────────────────────────────────────
// Sends a notification to all active FCM tokens for a given userId.
// Automatically removes any stale tokens that Firebase rejects.
const sendToUser = async (userId, notification, data = {}) => {
  const user = await User.findById(userId).select('fcmTokenMobile fcmTokenWeb fcmToken');
  if (!user) return;

  // Collect every non-null token (web, mobile, legacy)
  const tokens = [user.fcmTokenMobile, user.fcmTokenWeb, user.fcmToken]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i); // deduplicate

  if (!tokens.length) return;

  const invalidTokens = [];

  await Promise.allSettled(
    tokens.map(async (token) => {
      try {
        await getMessaging().send({
          token,
          notification: { title: notification.title, body: notification.body },
          data:         stringifyData(data),
          android:      { priority: 'high' },
          apns:         { payload: { aps: { sound: 'default' } } },
        });
      } catch (err) {
        const stale = [
          'messaging/invalid-registration-token',
          'messaging/registration-token-not-registered',
          'messaging/invalid-argument',
        ];
        if (stale.includes(err.code)) {
          invalidTokens.push(token);
        } else {
          console.error(`[firebase] sendToUser token error (${token.slice(-8)}):`, err.message);
        }
      }
    })
  );

  // Clear stale tokens from the user document
  if (invalidTokens.length) {
    const unset = {};
    if (invalidTokens.includes(user.fcmTokenMobile)) unset.fcmTokenMobile = '';
    if (invalidTokens.includes(user.fcmTokenWeb))    unset.fcmTokenWeb    = '';
    if (invalidTokens.includes(user.fcmToken))       unset.fcmToken       = '';
    await User.findByIdAndUpdate(userId, { $unset: unset });
  }
};

// ── sendNewBookNotification ───────────────────────────────────────────────────
// Notify all users in the book's faculty when a new book is added.
const sendNewBookNotification = async (book) => {
  const faculty = book.faculty?.[0];
  if (!faculty) return;

  const users = await User.find({ faculty, isActive: true }).select('_id').lean();

  await Promise.allSettled(
    users.map((u) =>
      sendToUser(
        u._id,
        {
          title: '📚 New book available!',
          body:  `"${book.title}" has been added to the ${faculty} collection.`,
        },
        { type: 'new_book', bookId: String(book._id) }
      )
    )
  );
};

// ── sendReadingReminder ───────────────────────────────────────────────────────
const sendReadingReminder = async (userId, bookTitle) => {
  await sendToUser(
    userId,
    {
      title: '📖 Time to read!',
      body:  `Continue reading "${bookTitle}"`,
    },
    { type: 'reading_reminder' }
  );
};

// ── sendWeeklyDigest ──────────────────────────────────────────────────────────
// stats = { booksRead, minutesRead, sessions }
const sendWeeklyDigest = async (userId, stats = {}) => {
  const mins = stats.minutesRead ?? 0;
  const hrs  = Math.floor(mins / 60);
  const rem  = mins % 60;
  const time = hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`;

  await sendToUser(
    userId,
    {
      title: '📊 Your weekly reading summary',
      body:  `You read ${time} this week across ${stats.sessions ?? 0} sessions.`,
    },
    {
      type:       'weekly_digest',
      booksRead:  String(stats.booksRead  ?? 0),
      minutesRead: String(mins),
      sessions:   String(stats.sessions   ?? 0),
    }
  );
};

module.exports = {
  sendPushNotification,
  sendMulticast,
  sendToUser,
  sendNewBookNotification,
  sendReadingReminder,
  sendWeeklyDigest,
};
