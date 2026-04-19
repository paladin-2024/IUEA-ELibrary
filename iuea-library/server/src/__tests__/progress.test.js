'use strict';

jest.mock('../config/prisma', () => require('./mocks/prisma.mock'));
jest.mock('../config/firebase', () => ({ initFirebase: jest.fn(), getMessaging: jest.fn() }));

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../app');
const prisma  = require('../config/prisma');

const TOKEN     = jwt.sign({ id: 'user-1', role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const MOCK_USER = { id: 'user-1', name: 'Alice', email: 'alice@iuea.ac.ug', role: 'student', isActive: true };
const BOOK_ID   = 'book-abc';

const MOCK_PROGRESS = {
  id:              'prog-1',
  userId:          'user-1',
  bookId:          BOOK_ID,
  percentComplete: 42,
  currentCfi:      'epubcfi(/6/2[chap01]!/4/2/1:0)',
  lastReadAt:      new Date().toISOString(),
  isCompleted:     false,
};

beforeEach(() => {
  prisma.user.findUnique.mockResolvedValue(MOCK_USER);
});

// ── PUT /api/progress/:bookId ─────────────────────────────────────────────────
describe('PUT /api/progress/:bookId', () => {
  it('saves reading progress', async () => {
    prisma.userProgress.upsert.mockResolvedValue(MOCK_PROGRESS);

    const res = await request(app)
      .put(`/api/progress/${BOOK_ID}`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ percentComplete: 42, currentCfi: 'epubcfi(/6/2!)' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('progress');
    expect(res.body.progress).toHaveProperty('percentComplete', 42);
  });

  it('marks book as completed when percentComplete >= 100', async () => {
    prisma.userProgress.upsert.mockResolvedValue({ ...MOCK_PROGRESS, percentComplete: 100, isCompleted: true });

    const res = await request(app)
      .put(`/api/progress/${BOOK_ID}`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ percentComplete: 100 });

    expect(res.status).toBe(200);
    // upsert should have been called with isCompleted: true in the data
    const call = prisma.userProgress.upsert.mock.calls[0][0];
    expect(call.create).toHaveProperty('isCompleted', true);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .put(`/api/progress/${BOOK_ID}`)
      .send({ percentComplete: 10 });
    expect(res.status).toBe(401);
  });
});

// ── GET /api/progress/:bookId ─────────────────────────────────────────────────
describe('GET /api/progress/:bookId', () => {
  it('returns progress for a book', async () => {
    prisma.userProgress.findUnique.mockResolvedValue(MOCK_PROGRESS);

    const res = await request(app)
      .get(`/api/progress/${BOOK_ID}`)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('progress');
    expect(res.body.progress).toHaveProperty('bookId', BOOK_ID);
  });

  it('returns null when no progress exists', async () => {
    prisma.userProgress.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/progress/${BOOK_ID}`)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.progress).toBeNull();
  });
});

// ── GET /api/progress ─────────────────────────────────────────────────────────
describe('GET /api/progress', () => {
  it('returns all progress entries with book details', async () => {
    prisma.userProgress.findMany.mockResolvedValue([
      { ...MOCK_PROGRESS, book: { id: BOOK_ID, title: 'Test Book', author: 'Author', coverUrl: null } },
    ]);

    const res = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('progress');
    expect(res.body.progress).toHaveLength(1);
  });

  it('returns empty array when no books have been read', async () => {
    prisma.userProgress.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.progress).toEqual([]);
  });
});
