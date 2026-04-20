'use strict';

jest.mock('../config/prisma', () => require('./mocks/prisma.mock'));
jest.mock('../services/email.service', () => ({
  sendWelcomeEmail:    jest.fn().mockResolvedValue(null),
  sendPasswordReset:   jest.fn().mockResolvedValue(null),
  sendWeeklyDigest:    jest.fn().mockResolvedValue(null),
}));
jest.mock('../config/firebase', () => ({
  initFirebase: jest.fn(),
  getMessaging: jest.fn(),
}));

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const app     = require('../app');
const prisma  = require('../config/prisma');

// ── Fixtures ──────────────────────────────────────────────────────────────────
const HASH = bcrypt.hashSync('Password1!', 10);

const MOCK_USER = {
  id:           'user-1',
  name:         'Alice Nakato',
  email:        'alice@iuea.ac.ug',
  passwordHash: HASH,
  role:         'student',
  faculty:      'IT',
  isActive:     true,
  createdAt:    new Date().toISOString(),
};

function makeToken(user = MOCK_USER) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ ...MOCK_USER, id: 'new-1' });
  });

  it('creates a user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice Nakato', email: 'alice@iuea.ac.ug', password: 'Password1!' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'alice@iuea.ac.ug');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@iuea.ac.ug', password: 'Password1!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('returns 409 when email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'alice@iuea.ac.ug', password: 'Password1!' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already registered/i);
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('returns token on valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@iuea.ac.ug', password: 'Password1!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 401 on wrong password', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@iuea.ac.ug', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@iuea.ac.ug', password: 'Password1!' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when account is suspended', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...MOCK_USER, isActive: false });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@iuea.ac.ug', password: 'Password1!' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@iuea.ac.ug' });
    expect(res.status).toBe(400);
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  it('returns user when authenticated', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'user-1');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-valid-token');
    expect(res.status).toBe(401);
  });
});

// ── PUT /api/auth/me ──────────────────────────────────────────────────────────
describe('PUT /api/auth/me', () => {
  it('updates allowed profile fields', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    prisma.user.update.mockResolvedValue({ ...MOCK_USER, name: 'Alice Updated' });

    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: 'Alice Updated' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Alice Updated');
  });

  it('returns 400 when no updatable fields provided', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
  it('returns 200 regardless of whether email exists (anti-enumeration)', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@iuea.ac.ug' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if that email/i);
  });

  it('sends reset email when user exists', async () => {
    const emailSvc = require('../services/email.service');
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    prisma.user.update.mockResolvedValue(MOCK_USER);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'alice@iuea.ac.ug' });
    expect(res.status).toBe(200);
    expect(emailSvc.sendPasswordReset).toHaveBeenCalled();
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});
    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
describe('POST /api/auth/reset-password', () => {
  it('resets password with valid token', async () => {
    prisma.user.findFirst.mockResolvedValue(MOCK_USER);
    prisma.user.update.mockResolvedValue(MOCK_USER);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'valid-token-abc', password: 'NewPassword1!' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  it('returns 400 with invalid/expired token', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'bad-token', password: 'NewPassword1!' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'tok', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/8 characters/i);
  });
});
