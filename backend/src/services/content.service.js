/**
 * src/services/content.service.js
 *
 * Business logic for teacher content operations.
 * Handles upload creation, listing, and single-item retrieval.
 */

'use strict';

const prisma = require('../config/db');
const { createError } = require('../middlewares/error.middleware');
const { invalidateBroadcast } = require('./cache.service');

// Number of items per page when no limit is specified
const DEFAULT_LIMIT = 10;

/**
 * Creates a new content record after a file has been uploaded by Multer.
 *
 * @param {object} params
 * @param {number}  params.teacherId
 * @param {string}  params.title
 * @param {string}  params.subject         - Already lowercased by the Zod validator
 * @param {string}  [params.description]
 * @param {string}  params.filePath        - Bare filename only (e.g. "uuid.png"), NOT full path
 * @param {string}  params.fileType        - MIME type
 * @param {number}  params.fileSize        - File size in bytes
 * @param {string}  [params.startTime]     - ISO-8601 string
 * @param {string}  [params.endTime]       - ISO-8601 string
 * @param {number}  [params.rotationDurationMinutes]
 * @returns {Promise<object>} The created content record
 */
async function createContent({
  teacherId,
  title,
  subject,
  description,
  filePath,
  fileType,
  fileSize,
  startTime,
  endTime,
  rotationDurationMinutes,
}) {
  const data = {
    title,
    subject: subject.toLowerCase(),
    description: description || null,
    filePath,
    fileType,
    fileSize,
    uploadedById: teacherId,
    status: 'PENDING',
  };

  if (startTime) data.startTime = new Date(startTime);
  if (endTime) data.endTime = new Date(endTime);
  if (rotationDurationMinutes !== undefined) data.rotationDurationMinutes = rotationDurationMinutes;

  const content = await prisma.content.create({
    data,
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Invalidate broadcast cache for this teacher + subject so a fresh query
  // picks up the new pending item (though pending items aren't served, invalidation
  // ensures consistency if this item is quickly approved)
  await invalidateBroadcast(teacherId, subject);

  return content;
}

/**
 * Lists a teacher's own content with optional filters and pagination.
 *
 * @param {object} params
 * @param {number} params.teacherId
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.status]
 * @param {string} [params.subject]
 * @returns {Promise<{ items: Array, total: number, page: number, limit: number, totalPages: number }>}
 */
async function getMyContent({ teacherId, page = 1, limit = DEFAULT_LIMIT, status, subject }) {
  const skip = (page - 1) * limit;

  const where = { uploadedById: teacherId };
  if (status) where.status = status;
  if (subject) where.subject = subject.toLowerCase();

  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.content.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Retrieves a single content item.
 * Teachers can only view their own content; principals can view anyone's.
 *
 * @param {number} contentId
 * @param {{ id: number, role: string }} requestingUser
 * @returns {Promise<object>}
 */
async function getContentById(contentId, requestingUser) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!content) {
    throw createError('Content not found', 'NOT_FOUND', 404);
  }

  // Teachers can only see their own content
  if (requestingUser.role === 'TEACHER' && content.uploadedById !== requestingUser.id) {
    throw createError('Access denied', 'FORBIDDEN', 403);
  }

  return content;
}

module.exports = { createContent, getMyContent, getContentById };
