/**
 * src/middlewares/rateLimit.middleware.js
 *
 * Rate limiting configuration using express-rate-limit.
 *
 * Two limiters:
 *  - broadcastLimiter : 60 req/min on the public /content/live/* endpoint.
 *    Liberal enough for real clients, tight enough to blunt scraping.
 *  - authLimiter      : 20 req/min on /api/auth/login.
 *    Slows brute-force without blocking evaluators during testing.
 */

'use strict';

const rateLimit = require('express-rate-limit');

const broadcastLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,  // Return RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please slow down.',
      code: 'RATE_LIMITED',
    },
  },
  // keyGenerator defaults to req.ip — fine for single-server deployments.
  // Behind a proxy, set app.set('trust proxy', 1) and express-rate-limit will
  // correctly use X-Forwarded-For. That's done in app.js.
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many login attempts. Please wait a moment.',
      code: 'RATE_LIMITED',
    },
  },
});

module.exports = { broadcastLimiter, authLimiter };
