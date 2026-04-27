/**
 * src/controllers/broadcast.controller.js
 *
 * Public endpoints for the live content broadcast.
 * No authentication — these are hit by browsers, mobile clients, displays.
 *
 * Critical contract (assignment-specified):
 *   - NEVER return 404 or an error shape for empty results
 *   - Always return { success: true, data: [] } with a message on empty
 */

'use strict';

const schedulerService = require('../services/scheduler.service');
const cacheService = require('../services/cache.service');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * GET /content/live
 * Discovery endpoint — returns API usage instructions.
 */
const getLiveIndex = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Broadcasts are per-teacher. Hit /content/live/teacher-{id} to get active content.',
    examples: [
      '/content/live/teacher-1',
      '/content/live/teacher-2',
      '/content/live/teacher-1?subject=maths',
    ],
  });
});

/**
 * GET /content/live/teacher-:teacherId
 * Public. Rate-limited. Returns the currently active content for a teacher.
 *
 * Route param  : teacher-{number}    (Express extracts just the number as teacherId)
 * Query param  : ?subject=maths      (optional)
 *
 * Response on hit:
 *   { success: true, data: [ ...BroadcastItem ] }
 *
 * Response on miss (ANY reason — teacher not found, no approved content, etc.):
 *   { success: true, data: [], message: "No content available" }
 */
const getLiveForTeacher = asyncHandler(async (req, res) => {
  const teacherIdStr = req.params.teacherId;
  const subject = req.query.subject ? req.query.subject.trim().toLowerCase() : null;

  // Validate the teacherId param — if non-numeric, return empty response (not 400)
  const teacherId = parseInt(teacherIdStr, 10);
  if (isNaN(teacherId) || teacherId < 1) {
    logger.debug('Non-numeric teacherId in broadcast request', { teacherIdStr });
    return res.status(200).json({
      success: true,
      data: [],
      message: 'No content available',
    });
  }

  // Build cache key for this specific teacher + subject combination
  const cacheKey = cacheService.broadcastKey(teacherId, subject || 'all');

  // Attempt to serve from cache; fall back to scheduler on miss or Redis outage
  const data = await cacheService.getOrSet(
    cacheKey,
    cacheService.BROADCAST_TTL,
    () => schedulerService.getActiveContentForTeacher(teacherId, subject)
  );

  if (data.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
      message: 'No content available',
    });
  }

  return res.status(200).json({
    success: true,
    data,
  });
});

module.exports = { getLiveIndex, getLiveForTeacher };
