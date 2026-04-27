/**
 * src/services/cache.service.js
 *
 * Redis-backed caching layer with graceful degradation.
 *
 * If Redis is unavailable, every operation falls through to the fetcher
 * function and the result is returned directly from the database.
 * The application NEVER crashes because of a Redis failure.
 *
 * Cache key conventions:
 *   broadcast:<teacherId>:all         — all subjects for a teacher
 *   broadcast:<teacherId>:<subject>   — filtered by subject
 */

'use strict';

const redis = require('../config/redis');
const logger = require('../utils/logger');

// Default TTL for broadcast cache entries (seconds)
const BROADCAST_TTL = 30;

/**
 * Retrieves a cached value or calls the fetcher to populate the cache.
 *
 * @param {string} key       - Redis cache key
 * @param {number} ttl       - Time-to-live in seconds
 * @param {Function} fetcher - Async function that returns the value on cache miss
 * @returns {Promise<any>}   - The cached or freshly fetched value
 */
async function getOrSet(key, ttl, fetcher) {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      logger.debug('Cache hit', { key });
      return JSON.parse(cached);
    }
  } catch (err) {
    // Redis is unavailable — log a warning and proceed to the fetcher
    logger.warn('Cache GET failed, bypassing cache', { key, error: err.message });
    return fetcher();
  }

  // Cache miss — call the fetcher
  const value = await fetcher();

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
    logger.debug('Cache set', { key, ttl });
  } catch (err) {
    // Failed to write to cache — the value is still returned from the fetcher
    logger.warn('Cache SET failed, result served from DB', { key, error: err.message });
  }

  return value;
}

/**
 * Deletes one or more cache keys. Used to invalidate broadcast cache
 * when content is approved, rejected, or newly uploaded.
 *
 * @param {...string} keys - Cache keys to delete
 * @returns {Promise<void>}
 */
async function invalidate(...keys) {
  if (!keys.length) return;

  try {
    await redis.del(...keys);
    logger.debug('Cache invalidated', { keys });
  } catch (err) {
    // Non-fatal — stale data will expire naturally after the TTL
    logger.warn('Cache DEL failed (stale data may persist until TTL)', { keys, error: err.message });
  }
}

/**
 * Builds the broadcast cache key for a given teacher + optional subject.
 *
 * @param {number} teacherId
 * @param {string|null} [subject]
 * @returns {string}
 */
function broadcastKey(teacherId, subject) {
  const subjectPart = subject ? subject.toLowerCase() : 'all';
  return `broadcast:${teacherId}:${subjectPart}`;
}

/**
 * Invalidates all broadcast cache keys for a given teacher.
 * Call this whenever a teacher's content changes state (uploaded, approved, rejected).
 *
 * @param {number} teacherId
 * @param {string|null} [subject] - If known, also invalidate the subject-specific key
 * @returns {Promise<void>}
 */
async function invalidateBroadcast(teacherId, subject) {
  const keysToDelete = [broadcastKey(teacherId, 'all')];
  if (subject) {
    keysToDelete.push(broadcastKey(teacherId, subject.toLowerCase()));
  }
  await invalidate(...keysToDelete);
}

module.exports = {
  getOrSet,
  invalidate,
  broadcastKey,
  invalidateBroadcast,
  BROADCAST_TTL,
};
