'use strict';

jest.mock('../config/prisma', () => require('./mocks/prisma.mock'));

const prisma = require('../config/prisma');
const { updateStreak } = require('../controllers/streaks.controller');

const BASE_USER = {
  id:                  'user-1',
  currentStreak:       1,
  longestStreak:       1,
  lastReadDate:        null,
  totalXp:             0,
  totalReadingMinutes: 0,
  badges:              [],
  preferredLanguages:  [],
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.user.findUnique.mockResolvedValue({ ...BASE_USER });
  prisma.user.update.mockResolvedValue({});
  prisma.userProgress.count.mockResolvedValue(0);
});

// ── first_book badge ──────────────────────────────────────────────────────────
describe('first_book badge', () => {
  it('awards first_book badge when a book is completed', async () => {
    await updateStreak('user-1', { isCompleted: true });

    const call = prisma.user.update.mock.calls.find(
      ([args]) => Array.isArray(args.data?.badges),
    );
    expect(call).toBeDefined();
    expect(call[0].data.badges).toContain('first_book');
  });

  it('does not award first_book badge when book is not completed', async () => {
    await updateStreak('user-1', { isCompleted: false });

    const call = prisma.user.update.mock.calls.find(
      ([args]) => Array.isArray(args.data?.badges),
    );
    expect(call[0].data.badges).not.toContain('first_book');
  });
});

// ── book_worm badge ───────────────────────────────────────────────────────────
describe('book_worm badge', () => {
  it('awards book_worm badge when user has completed 10 books', async () => {
    prisma.userProgress.count.mockResolvedValue(10);

    await updateStreak('user-1', { isCompleted: true });

    const call = prisma.user.update.mock.calls.find(
      ([args]) => Array.isArray(args.data?.badges),
    );
    expect(call[0].data.badges).toContain('book_worm');
  });

  it('does not award book_worm badge when user has completed fewer than 10 books', async () => {
    prisma.userProgress.count.mockResolvedValue(9);

    await updateStreak('user-1', { isCompleted: true });

    const call = prisma.user.update.mock.calls.find(
      ([args]) => Array.isArray(args.data?.badges),
    );
    expect(call[0].data.badges).not.toContain('book_worm');
  });
});

// ── scholar badge ─────────────────────────────────────────────────────────────
describe('scholar badge', () => {
  it('awards scholar badge when user has completed 25 books', async () => {
    prisma.userProgress.count.mockResolvedValue(25);

    await updateStreak('user-1', { isCompleted: true });

    const call = prisma.user.update.mock.calls.find(
      ([args]) => Array.isArray(args.data?.badges),
    );
    expect(call[0].data.badges).toContain('scholar');
  });

  it('does not award scholar badge when user has completed fewer than 25 books', async () => {
    prisma.userProgress.count.mockResolvedValue(24);

    await updateStreak('user-1', { isCompleted: true });

    const call = prisma.user.update.mock.calls.find(
      ([args]) => Array.isArray(args.data?.badges),
    );
    expect(call[0].data.badges).not.toContain('scholar');
  });

  it('awards both book_worm and scholar when user has completed 25+ books', async () => {
    prisma.userProgress.count.mockResolvedValue(30);

    await updateStreak('user-1', { isCompleted: true });

    const call = prisma.user.update.mock.calls.find(
      ([args]) => Array.isArray(args.data?.badges),
    );
    expect(call[0].data.badges).toContain('book_worm');
    expect(call[0].data.badges).toContain('scholar');
  });
});
