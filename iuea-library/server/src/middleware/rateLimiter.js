const rateLimit = require('express-rate-limit');

// Bypass all rate limits in test environment so suites can call endpoints
// freely without hitting windows that carry over between test files.
const IS_TEST = process.env.NODE_ENV === 'test';
const noOp = (_req, _res, next) => next();

const defaultLimiter = IS_TEST ? noOp : rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = IS_TEST ? noOp : rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many login attempts, please try again later.' },
});

const chatLimiter = IS_TEST ? noOp : rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many chat requests, slow down.' },
});

module.exports = { defaultLimiter, authLimiter, chatLimiter };
