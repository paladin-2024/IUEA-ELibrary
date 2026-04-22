'use strict';

// updateStreak() uses Mongoose models directly — mock them here
jest.mock('../models/User', () => ({
  findById:          jest.fn(),
  findByIdAndUpdate: jest.fn().mockResolvedValue({}),
}));
jest.mock('../models/UserProgress', () => ({
  countDocuments: jest.fn(),
}));

const User         = require('../models/User');
const UserProgress = require('../models/UserProgress');
const { updateStreak } = require('../controllers/streaks.controller');

const BASE_USER = {
  _id:                 'user-1',
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
  User.findById.mockResolvedValue({ ...BASE_USER });
  User.findByIdAndUpdate.mockResolvedValue({});
  UserProgress.countDocuments.mockResolvedValue(0);
});

// ── first_book badge ──────────────────────────────────────────────────────────
describe('first_book badge', () => {
  it('awards first_book badge when a book is completed', async () => {
    await updateStreak('user-1', { isCompleted: true });

    const call = User.findByIdAndUpdate.mock.calls.find(
      ([, data]) => Array.isArray(data.badges)
    );
    expect(call).toBeDefined();
    expect(call[1].badges).toContain('first_book');
  });

  it('does not award first_book badge when book is not completed', async () => {
    await updateStreak('user-1', { isCompleted: false });

    const call = User.findByIdAndUpdate.mock.calls.find(
      ([, data]) => Array.isArray(data.badges)
    );
    expect(call[1].badges).not.toContain('first_book');
  });
});

// ── book_worm badge ───────────────────────────────────────────────────────────
describe('book_worm badge', () => {
  it('awards book_worm badge when user has completed 10 books', async () => {
    UserProgress.countDocuments.mockResolvedValue(10);

    await updateStreak('user-1', { isCompleted: true });

    const call = User.findByIdAndUpdate.mock.calls.find(
      ([, data]) => Array.isArray(data.badges)
    );
    expect(call[1].badges).toContain('book_worm');
  });

  it('does not award book_worm badge when user has completed fewer than 10 books', async () => {
    UserProgress.countDocuments.mockResolvedValue(9);

    await updateStreak('user-1', { isCompleted: true });

    const call = User.findByIdAndUpdate.mock.calls.find(
      ([, data]) => Array.isArray(data.badges)
    );
    expect(call[1].badges).not.toContain('book_worm');
  });
});

// ── scholar badge ─────────────────────────────────────────────────────────────
describe('scholar badge', () => {
  it('awards scholar badge when user has completed 25 books', async () => {
    UserProgress.countDocuments.mockResolvedValue(25);

    await updateStreak('user-1', { isCompleted: true });

    const call = User.findByIdAndUpdate.mock.calls.find(
      ([, data]) => Array.isArray(data.badges)
    );
    expect(call[1].badges).toContain('scholar');
  });

  it('does not award scholar badge when user has completed fewer than 25 books', async () => {
    UserProgress.countDocuments.mockResolvedValue(24);

    await updateStreak('user-1', { isCompleted: true });

    const call = User.findByIdAndUpdate.mock.calls.find(
      ([, data]) => Array.isArray(data.badges)
    );
    expect(call[1].badges).not.toContain('scholar');
  });

  it('awards both book_worm and scholar when user has completed 25+ books', async () => {
    UserProgress.countDocuments.mockResolvedValue(30);

    await updateStreak('user-1', { isCompleted: true });

    const call = User.findByIdAndUpdate.mock.calls.find(
      ([, data]) => Array.isArray(data.badges)
    );
    expect(call[1].badges).toContain('book_worm');
    expect(call[1].badges).toContain('scholar');
  });
});
