'use strict';

jest.mock('../config/prisma',  () => require('./mocks/prisma.mock'));
jest.mock('../config/firebase', () => ({ initFirebase: jest.fn(), getMessaging: jest.fn() }));
jest.mock('../services/koha.service', () => ({ searchBiblio: jest.fn().mockResolvedValue([]) }));
jest.mock('../services/podcast.service', () => ({ syncPodcast: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../services/r2.service', () => ({
  uploadBookFile: jest.fn().mockResolvedValue('http://localhost/uploads/book.epub'),
  uploadCover:    jest.fn().mockResolvedValue('http://localhost/uploads/cover.jpg'),
}));

// Mock Mongoose models used directly in admin controller for aggregation
jest.mock('../models/UserProgress', () => ({ aggregate: jest.fn().mockResolvedValue([]) }));
jest.mock('../models/Book',         () => ({ aggregate: jest.fn().mockResolvedValue([]) }));
jest.mock('../models/User',         () => ({ aggregate: jest.fn().mockResolvedValue([]) }));

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../app');
const prisma  = require('../config/prisma');

const ADMIN_TOKEN   = jwt.sign({ id: 'admin-1', role: 'admin'   }, process.env.JWT_SECRET, { expiresIn: '1h' });
const STUDENT_TOKEN = jwt.sign({ id: 'user-1',  role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1h' });

const MOCK_ADMIN   = { id: 'admin-1', name: 'Super Admin', email: 'admin@iuea.ac.ug', role: 'admin',   isActive: true };
const MOCK_STUDENT = { id: 'user-1',  name: 'Alice',       email: 'alice@iuea.ac.ug', role: 'student', isActive: true };

const BOOKS = [
  { id: 'b1', title: 'Law Basics', author: 'Prof. Okello', isActive: true, category: 'Law', languages: ['English'], faculty: [], tags: [], createdAt: new Date() },
];
const USERS = [
  { id: 'user-2', name: 'Bob Omara', email: 'bob@iuea.ac.ug', faculty: 'IT', role: 'student', isActive: true, createdAt: new Date() },
];

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockImplementation(({ where }) => {
      if (where?.id === 'admin-1')  return Promise.resolve(MOCK_ADMIN);
      if (where?.id === 'user-1')   return Promise.resolve(MOCK_STUDENT);
      return Promise.resolve(null);
    });
    prisma.user.count.mockResolvedValue(42);
    prisma.book.count.mockResolvedValue(1000);
    prisma.chatSession.count.mockResolvedValue(5);
    prisma.podcast.count.mockResolvedValue(10);
    prisma.userProgress.count.mockResolvedValue(80);
    prisma.user.findMany.mockResolvedValue([]);
  });

  it('returns aggregate stats for admin', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats).toHaveProperty('users', 42);
    expect(res.body.stats).toHaveProperty('books', 1000);
  });

  it('returns 403 for non-admin users', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/admin/books ──────────────────────────────────────────────────────
describe('GET /api/admin/books', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(MOCK_ADMIN);
    prisma.book.findMany.mockResolvedValue(BOOKS);
    prisma.book.count.mockResolvedValue(1);
  });

  it('returns paginated books', async () => {
    const res = await request(app)
      .get('/api/admin/books')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body).toHaveProperty('total', 1);
  });

  it('supports search query', async () => {
    prisma.book.findMany.mockResolvedValue([BOOKS[0]]);
    const res = await request(app)
      .get('/api/admin/books?q=Law')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
  });
});

// ── DELETE /api/admin/books/:id ───────────────────────────────────────────────
describe('DELETE /api/admin/books/:id', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(MOCK_ADMIN);
  });

  it('soft-deletes a book (sets isActive = false)', async () => {
    prisma.book.update.mockResolvedValue({ ...BOOKS[0], isActive: false });

    const res = await request(app)
      .delete('/api/admin/books/b1')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/archived/i);
    const call = prisma.book.update.mock.calls[0][0];
    expect(call.data).toHaveProperty('isActive', false);
  });

  it('returns 404 for non-existent book', async () => {
    const err = new Error('Not found'); err.code = 'P2025';
    prisma.book.update.mockRejectedValue(err);

    const res = await request(app)
      .delete('/api/admin/books/ghost')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(404);
  });
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
describe('GET /api/admin/users', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(MOCK_ADMIN);
    prisma.user.findMany.mockResolvedValue(USERS);
    prisma.user.count.mockResolvedValue(1);
  });

  it('returns paginated user list', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body).toHaveProperty('total', 1);
  });
});

// ── PATCH /api/admin/users/:id/suspend ────────────────────────────────────────
describe('PATCH /api/admin/users/:id/suspend', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockImplementation(({ where }) =>
      where?.id === 'admin-1'
        ? Promise.resolve(MOCK_ADMIN)
        : Promise.resolve({ ...USERS[0], id: where?.id })
    );
  });

  it('toggles user active status', async () => {
    prisma.user.update.mockResolvedValue({ ...USERS[0], isActive: false });

    const res = await request(app)
      .patch('/api/admin/users/user-2/suspend')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/suspended|reactivated/i);
  });

  it('returns 404 for unknown user', async () => {
    prisma.user.findUnique.mockImplementation(({ where }) =>
      where?.id === 'admin-1' ? Promise.resolve(MOCK_ADMIN) : Promise.resolve(null)
    );

    const res = await request(app)
      .patch('/api/admin/users/ghost/suspend')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(404);
  });
});

// ── GET /api/admin/users/:id ──────────────────────────────────────────────────
describe('GET /api/admin/users/:id', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockImplementation(({ where }) =>
      where?.id === 'admin-1'
        ? Promise.resolve(MOCK_ADMIN)
        : Promise.resolve({ ...USERS[0], id: where?.id })
    );
    prisma.userProgress.findMany.mockResolvedValue([]);
  });

  it('returns user detail with reading history', async () => {
    const res = await request(app)
      .get('/api/admin/users/user-2')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('progress');
  });
});
