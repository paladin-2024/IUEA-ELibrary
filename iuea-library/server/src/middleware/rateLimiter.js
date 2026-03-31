const rateLimit = require('express-rate-limit');

const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many login attempts, please try again later.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many chat requests, slow down.' },
});

module.exports = { defaultLimiter, authLimiter, chatLimiter };
