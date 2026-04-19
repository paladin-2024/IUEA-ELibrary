const { getMessaging } = require('../config/firebase');
const prisma           = require('../config/prisma');

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
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, fcmToken: true, fcmTokenMobile: true, fcmTokenWeb: true },
  });
  if (!user) return;

  // Collect every non-null token — deduplicated
  const tokens = [user.fcmTokenMobile, user.fcmTokenWeb, user.fcmToken]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);

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

  // Clear stale tokens from the user record
  if (invalidTokens.length) {
    const clearData = {};
    if (invalidTokens.includes(user.fcmTokenMobile)) clearData.fcmTokenMobile = null;
    if (invalidTokens.includes(user.fcmTokenWeb))    clearData.fcmTokenWeb    = null;
    if (invalidTokens.includes(user.fcmToken))       clearData.fcmToken       = null;
    await prisma.user.update({ where: { id: userId }, data: clearData });
  }
};

// ── sendNewBookNotification ───────────────────────────────────────────────────
// Notify all users in the book's faculty when a new book is added.
const sendNewBookNotification = async (book) => {
  const faculty = book.faculty?.[0];
  if (!faculty) return;

  // faculty on User is a scalar String (e.g. "Engineering"), not an array
  const users = await prisma.user.findMany({
    where:  { faculty, isActive: true },
    select: { id: true },
  });

  await Promise.allSettled(
    users.map((u) =>
      sendToUser(
        u.id,
        {
          title: '📚 New book available!',
          body:  `"${book.title}" has been added to the ${faculty} collection.`,
        },
        { type: 'new_book', bookId: String(book.id) }
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
      type:        'weekly_digest',
      booksRead:   String(stats.booksRead   ?? 0),
      minutesRead: String(mins),
      sessions:    String(stats.sessions    ?? 0),
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
