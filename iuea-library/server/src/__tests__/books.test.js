'use strict';

jest.mock('../config/prisma', () => require('./mocks/prisma.mock'));
jest.mock('../services/archive.service', () => ({ searchArchive: jest.fn().mockResolvedValue([]) }));
jest.mock('../services/r2.service',      () => ({
  uploadBookFile:     jest.fn().mockResolvedValue('http://localhost/uploads/book.epub'),
  uploadCover:        jest.fn().mockResolvedValue('http://localhost/uploads/cover.jpg'),
  getSignedDownloadUrl: jest.fn().mockResolvedValue('http://localhost/signed/book.epub'),
  deleteFile:         jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../config/firebase', () => ({ initFirebase: jest.fn(), getMessaging: jest.fn() }));

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../app');
const prisma  = require('../config/prisma');

const TOKEN = jwt.sign({ id: 'user-1', role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const MOCK_USER = { id: 'user-1', name: 'Alice', email: 'alice@iuea.ac.ug', role: 'student', isActive: true };

const BOOKS = [
  { id: 'b1', title: 'Introduction to Law', author: 'Prof. Okello', category: 'Law',
    languages: ['English'], isActive: true, rating: 4.2, ratingCount: 30,
    coverUrl: null, fileUrl: null, archiveId: null, faculty: ['Law'] },
  { id: 'b2', title: 'Engineering Fundamentals', author: 'Dr. Kato', category: 'Engineering',
    languages: ['English', 'French'], isActive: true, rating: 3.8, ratingCount: 15,
    coverUrl: null, fileUrl: null, archiveId: null, faculty: ['Engineering'] },
];

beforeEach(() => {
  prisma.user.findUnique.mockResolvedValue(MOCK_USER);
});

// ── GET /api/books ────────────────────────────────────────────────────────────
describe('GET /api/books', () => {
  it('returns paginated book list', async () => {
    prisma.book.findMany.mockResolvedValue(BOOKS);
    prisma.book.count.mockResolvedValue(2);

    const res = await request(app)
      .get('/api/books')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('books');
    expect(res.body.books).toHaveLength(2);
    expect(res.body).toHaveProperty('total', 2);
    expect(res.body).toHaveProperty('page', 1);
  });

  it('supports category filter', async () => {
    prisma.book.findMany.mockResolvedValue([BOOKS[0]]);
    prisma.book.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/books?category=Law')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].category).toBe('Law');
  });

  it('supports pagination via page + limit', async () => {
    prisma.book.findMany.mockResolvedValue([BOOKS[1]]);
    prisma.book.count.mockResolvedValue(2);

    const res = await request(app)
      .get('/api/books?page=2&limit=1')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 2, pages: 2 });
  });
});

// ── GET /api/books/featured ───────────────────────────────────────────────────
describe('GET /api/books/featured', () => {
  it('returns up to 10 featured books', async () => {
    prisma.book.findMany.mockResolvedValue(BOOKS);

    const res = await request(app)
      .get('/api/books/featured')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('books');
    expect(Array.isArray(res.body.books)).toBe(true);
  });
});

// ── GET /api/books/:id ────────────────────────────────────────────────────────
describe('GET /api/books/:id', () => {
  it('returns single book by id', async () => {
    prisma.book.findUnique.mockResolvedValue(BOOKS[0]);
    prisma.userProgress.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/books/b1')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.book).toMatchObject({ id: 'b1', title: 'Introduction to Law' });
  });

  it('returns 404 when book not found', async () => {
    prisma.book.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/books/nonexistent')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(404);
  });

  it('generates signed fileUrl from fileKey when book has a fileKey', async () => {
    const bookWithKey = {
      ...BOOKS[0],
      fileKey: 'books/b1.epub',
      fileUrl:  null,
    };
    prisma.book.findUnique.mockResolvedValue(bookWithKey);

    const res = await request(app)
      .get('/api/books/b1')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.book.fileUrl).toBe('http://localhost/signed/book.epub');
  });

  it('returns stored fileUrl directly when book has no fileKey', async () => {
    const bookWithUrl = {
      ...BOOKS[0],
      fileKey: null,
      fileUrl: 'https://public.r2.dev/books/b1.epub',
    };
    prisma.book.findUnique.mockResolvedValue(bookWithUrl);

    const res = await request(app)
      .get('/api/books/b1')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.book.fileUrl).toBe('https://public.r2.dev/books/b1.epub');
  });
});

// ── GET /api/books/continue ───────────────────────────────────────────────────
describe('GET /api/books/continue', () => {
  it('returns books in progress for the authenticated user', async () => {
    prisma.userProgress.findMany.mockResolvedValue([
      { book: BOOKS[0], percentComplete: 45, currentCfi: 'epubcfi(/1/2)', lastDevice: 'web' },
    ]);

    const res = await request(app)
      .get('/api/books/continue')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('books');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/books/continue');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/books?sort=newest ────────────────────────────────────────────────
describe('GET /api/books?sort=newest', () => {
  it('returns newest books when sort=newest', async () => {
    prisma.book.findMany.mockResolvedValue(BOOKS);
    prisma.book.count.mockResolvedValue(2);

    const res = await request(app)
      .get('/api/books?sort=newest')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('books');
    expect(Array.isArray(res.body.books)).toBe(true);
  });
});
