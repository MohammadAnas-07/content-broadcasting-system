/**
 * src/config/redis.js
 *
 * Redis client singleton using ioredis.
 *
 * Design decisions:
 * - lazyConnect: true  — the connection isn't established until the first command,
 *   which prevents the app from crashing at startup if Redis is unavailable.
 * - enableOfflineQueue: false — commands issued while Redis is down fail immediately
 *   instead of queuing forever, so cache.service.js can catch the error and fall
 *   through to the database without hanging requests.
 * - maxRetriesPerRequest: 1 — fail fast, don't block a request retrying Redis.
 *
 * If REDIS_URL is not set in the environment, a no-op stub is exported so the
 * rest of the codebase never has to check whether Redis is configured. All cache
 * operations simply return null / resolve immediately.
 *
 * The cache service wraps every Redis call in try/catch, so if this client
 * errors the app continues to serve requests from the database. Redis is a
 * performance optimisation, not a hard dependency.
 */

'use strict';

const Redis = require('ioredis');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL;

// ── If REDIS_URL is not configured, export a no-op stub ───────────────────────
// This keeps the rest of the codebase clean — cache.service.js calls redis.get()
// and redis.set() without knowing or caring that Redis isn't available.
if (!REDIS_URL) {
  logger.info('REDIS_URL not set — Redis caching disabled (serving all requests from DB)');

  // Minimal stub that mimics the ioredis API surface used by cache.service.js
  const stub = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    on: () => stub, // allow chaining .on() calls without crashing
    connect: async () => {},
    status: 'ready',
  };

  module.exports = stub;
  return; // Stop executing the rest of this file
}

// ── Real Redis client ──────────────────────────────────────────────────────────

const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
  // Cap reconnection attempts to prevent infinite retry noise when Redis is down.
  // After 10 attempts (~30s of backoff), ioredis stops retrying automatically.
  retryStrategy(times) {
    if (times > 10) {
      logger.warn('Redis max reconnect attempts reached — giving up until next request');
      return null; // Stop retrying
    }
    // Exponential backoff: 100ms, 200ms, 400ms, ... capped at 3s
    return Math.min(100 * Math.pow(2, times - 1), 3000);
  },
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('ready', () => logger.info('Redis ready'));
redis.on('error', (err) => logger.warn('Redis error (non-fatal, falling back to DB)', { message: err.message }));
redis.on('close', () => logger.warn('Redis connection closed'));

// Attempt an initial connection — failure is non-fatal
redis.connect().catch((err) => {
  logger.warn('Redis initial connect failed — caching disabled until reconnect', { message: err.message });
});

module.exports = redis;
