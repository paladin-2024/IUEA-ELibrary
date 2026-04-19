'use strict';

jest.mock('../config/prisma',  () => require('./mocks/prisma.mock'));
jest.mock('../config/firebase', () => ({ initFirebase: jest.fn(), getMessaging: jest.fn() }));

const jwt    = require('jsonwebtoken');
const prisma = require('../config/prisma');

const MOCK_USER  = { id: 'u1', name: 'Alice', email: 'a@iuea.ac.ug', role: 'student', isActive: true };
const MOCK_ADMIN = { id: 'a1', name: 'Admin', email: 'admin@iuea.ac.ug', role: 'admin',   isActive: true };

// ── authGuard ─────────────────────────────────────────────────────────────────
describe('authGuard middleware', () => {
  const authGuard = require('../middleware/authGuard');

  function mockReqRes(authHeader) {
    const req = { headers: { authorization: authHeader } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    return { req, res, next };
  }

  it('calls next() with req.user set when token is valid', async () => {
    prisma.user.findUnique.mockResolvedValue(MOCK_USER);
    const token = jwt.sign({ id: 'u1', role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const { req, res, next } = mockReqRes(`Bearer ${token}`);
    await authGuard(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 'u1' });
  });

  it('returns 401 when no Authorization header', async () => {
    const { req, res, next } = mockReqRes(undefined);
    await authGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 with wrong format (no Bearer prefix)', async () => {
    const { req, res, next } = mockReqRes('Token abc123');
    await authGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 with malformed JWT', async () => {
    const { req, res, next } = mockReqRes('Bearer not.a.jwt');
    await authGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when user not found in DB', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const token = jwt.sign({ id: 'ghost', role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const { req, res, next } = mockReqRes(`Bearer ${token}`);
    await authGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when user is inactive', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...MOCK_USER, isActive: false });
    const token = jwt.sign({ id: 'u1', role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const { req, res, next } = mockReqRes(`Bearer ${token}`);
    await authGuard(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ── adminOnly ─────────────────────────────────────────────────────────────────
describe('adminOnly middleware', () => {
  const adminOnly = require('../middleware/adminOnly');

  function mockReqRes(user) {
    const req = { user };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    return { req, res, next };
  }

  it('calls next() for admin users', () => {
    const { req, res, next } = mockReqRes(MOCK_ADMIN);
    adminOnly(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 for non-admin users', () => {
    const { req, res, next } = mockReqRes(MOCK_USER);
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user is undefined', () => {
    const { req, res, next } = mockReqRes(undefined);
    adminOnly(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── errorHandler ─────────────────────────────────────────────────────────────
describe('errorHandler middleware', () => {
  const { errorHandler } = require('../middleware/errorHandler');

  function mockRes() {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    return res;
  }

  it('returns 400 for Prisma-style validation error', () => {
    const err = new Error('Validation failed');
    err.name   = 'ValidationError';
    err.errors = { email: { message: 'Invalid email' } };

    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 for duplicate key error', () => {
    const err  = new Error('dup');
    err.code   = 11000;
    err.keyValue = { email: 'x@y.com' };

    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/already exists/i) }));
  });

  it('returns 401 for JsonWebTokenError', () => {
    const err  = new Error('jwt malformed');
    err.name   = 'JsonWebTokenError';

    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for TokenExpiredError', () => {
    const err  = new Error('jwt expired');
    err.name   = 'TokenExpiredError';

    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 for unhandled errors', () => {
    const err = new Error('Something broke');

    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('uses statusCode from error when present', () => {
    const err = new Error('Custom error');
    err.statusCode = 422;

    const res = mockRes();
    errorHandler(err, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
  });
});
