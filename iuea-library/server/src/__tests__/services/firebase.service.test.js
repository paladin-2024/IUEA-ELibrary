'use strict';

jest.mock('../../config/prisma', () => require('../mocks/prisma.mock'));

const mockSend = jest.fn().mockResolvedValue({ name: 'projects/test/messages/1' });

jest.mock('../../config/firebase', () => ({
  initFirebase: jest.fn(),
  getMessaging: jest.fn(() => ({
    send:                 mockSend,
    sendEachForMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
  })),
}));

const prisma = require('../../config/prisma');
const {
  sendPushNotification,
  sendMulticast,
  sendToUser,
  sendNewBookNotification,
  sendReadingReminder,
  sendWeeklyDigest,
} = require('../../services/firebase.service');

const USER_WITH_TOKENS = {
  id:             'u1',
  fcmToken:       'tok-legacy',
  fcmTokenMobile: 'tok-mobile',
  fcmTokenWeb:    'tok-web',
};

afterEach(() => {
  mockSend.mockClear();
});

// ── sendPushNotification ──────────────────────────────────────────────────────
describe('firebase.service — sendPushNotification', () => {
  it('sends notification to single token', async () => {
    await sendPushNotification({ token: 'tok-abc', title: 'Hi', body: 'Test' });
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0]).toHaveProperty('token', 'tok-abc');
  });

  it('returns null without throwing when token is falsy', async () => {
    const result = await sendPushNotification({ token: null, title: 'Hi', body: 'Test' });
    expect(result).toBeNull();
    expect(mockSend).not.toHaveBeenCalled();
  });
});

// ── sendToUser ────────────────────────────────────────────────────────────────
describe('firebase.service — sendToUser', () => {
  it('sends to all 3 deduped tokens of a user', async () => {
    prisma.user.findUnique.mockResolvedValue(USER_WITH_TOKENS);

    await sendToUser('u1', { title: 'New Book', body: 'Check it out' });

    // tok-legacy, tok-mobile, tok-web are all distinct → 3 sends
    expect(mockSend).toHaveBeenCalledTimes(3);
  });

  it('deduplicates identical tokens', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', fcmToken: 'same-tok', fcmTokenMobile: 'same-tok', fcmTokenWeb: null,
    });

    await sendToUser('u1', { title: 'Hi', body: 'World' });

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('does nothing when user has no tokens', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', fcmToken: null, fcmTokenMobile: null, fcmTokenWeb: null,
    });

    await sendToUser('u1', { title: 'Hi', body: 'World' });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('does nothing when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await sendToUser('ghost', { title: 'Hi', body: 'World' });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('clears stale token and updates user when FCM rejects it', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', fcmToken: 'stale-tok', fcmTokenMobile: null, fcmTokenWeb: null,
    });
    const staleErr  = new Error('Invalid token');
    staleErr.code   = 'messaging/invalid-registration-token';
    mockSend.mockRejectedValueOnce(staleErr);
    prisma.user.update.mockResolvedValue({});

    await sendToUser('u1', { title: 'Hi', body: 'World' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fcmToken: null }) })
    );
  });
});

// ── sendNewBookNotification ───────────────────────────────────────────────────
describe('firebase.service — sendNewBookNotification', () => {
  it('notifies all users in the book faculty', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    prisma.user.findUnique
      .mockResolvedValue({ id: 'u1', fcmToken: 'tok-1', fcmTokenMobile: null, fcmTokenWeb: null });

    const book = { id: 'b1', title: 'Law Basics', faculty: ['Law'] };
    await sendNewBookNotification(book);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ faculty: 'Law' }) })
    );
  });

  it('does nothing when book has no faculty', async () => {
    await sendNewBookNotification({ id: 'b1', title: 'Misc', faculty: [] });
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});

// ── sendReadingReminder / sendWeeklyDigest ────────────────────────────────────
describe('firebase.service — sendReadingReminder', () => {
  it('sends a reading reminder to the user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', fcmToken: 'tok', fcmTokenMobile: null, fcmTokenWeb: null,
    });

    await sendReadingReminder('u1', 'Introduction to Law');

    expect(mockSend.mock.calls[0][0].notification.body).toContain('Introduction to Law');
  });
});

describe('firebase.service — sendWeeklyDigest', () => {
  it('sends weekly digest notification with stats in data', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', fcmToken: 'tok', fcmTokenMobile: null, fcmTokenWeb: null,
    });

    await sendWeeklyDigest('u1', { booksRead: 2, minutesRead: 120, sessions: 5 });

    const call = mockSend.mock.calls[0][0];
    expect(call.data).toHaveProperty('booksRead', '2');
    expect(call.notification.body).toContain('2h');
  });
});
