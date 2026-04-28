/**
 * src/services/approval.service.js
 *
 * Business logic for principal approval/rejection of content.
 *
 * State machine:
 *   PENDING → APPROVED (via approve)
 *   PENDING → REJECTED (via reject)
 *   APPROVED / REJECTED → (no transition allowed — returns 409 Conflict)
 *
 * Once rejected, content stays rejected. Teachers must upload new content.
 * This avoids a complex re-submission state machine. See architecture-notes.txt.
 */

'use strict';

const prisma = require('../config/db');
const { createError } = require('../middlewares/error.middleware');
const { invalidateBroadcast } = require('./cache.service');

const DEFAULT_LIMIT = 10;

/**
 * Lists all content currently in PENDING status with teacher info.
 * Paginated, newest first.
 *
 * @param {{ page: number, limit: number }} params
 * @returns {Promise<object>}
 */
async function getPendingContent({ page = 1, limit = DEFAULT_LIMIT }) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where: { status: 'PENDING' },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.content.count({ where: { status: 'PENDING' } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Lists all content (any status) with optional filters.
 * Used by the principal to get a full overview.
 *
 * @param {{ page: number, limit: number, status?: string, subject?: string, teacherId?: number }} params
 * @returns {Promise<object>}
 */
async function getAllContent({ page = 1, limit = DEFAULT_LIMIT, status, subject, teacherId }) {
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (subject) where.subject = subject.toLowerCase();
  if (teacherId) where.uploadedById = teacherId;

  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true, role: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.content.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Approves a content item. Only PENDING content can be approved.
 * Returns 409 if the content is already APPROVED or REJECTED.
 *
 * @param {number} contentId
 * @param {number} principalId - The approving principal's user ID
 * @returns {Promise<object>} The updated content record
 */
async function approveContent(contentId, principalId) {
  // Fetch the content to check its current status
  const content = await prisma.content.findUnique({
    where: { id: contentId },
  });

  if (!content) {
    throw createError('Content not found', 'NOT_FOUND', 404);
  }

  if (content.status !== 'PENDING') {
    throw createError(
      `Cannot approve content that is already ${content.status.toLowerCase()}. Expected PENDING.`,
      'CONFLICT',
      409
    );
  }

  const updated = await prisma.content.update({
    where: { id: contentId },
    data: {
      status: 'APPROVED',
      approvedById: principalId,
      approvedAt: new Date(),
      rejectionReason: null, // Clear any prior rejection reason (shouldn't exist but be clean)
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });

  // Invalidate the broadcast cache for this teacher — the newly approved item
  // may now be served by the rotation engine.
  await invalidateBroadcast(updated.uploadedById, updated.subject);

  return updated;
}

/**
 * Rejects a content item with a required reason. Only PENDING content can be rejected.
 * Returns 409 if the content is already APPROVED or REJECTED.
 *
 * @param {number} contentId
 * @param {number} principalId
 * @param {string} rejectionReason - Must be at least 5 characters (validated by Zod)
 * @returns {Promise<object>} The updated content record
 */
async function rejectContent(contentId, principalId, rejectionReason) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });

  if (!content) {
    throw createError('Content not found', 'NOT_FOUND', 404);
  }

  if (content.status !== 'PENDING') {
    throw createError(
      `Cannot reject content that is already ${content.status.toLowerCase()}. Expected PENDING.`,
      'CONFLICT',
      409
    );
  }

  const updated = await prisma.content.update({
    where: { id: contentId },
    data: {
      status: 'REJECTED',
      rejectionReason,
      approvedById: principalId, // Record who made the decision
      approvedAt: new Date(),
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });

  // Invalidate cache (though rejected items don't show in the broadcast,
  // the invalidation ensures consistency)
  await invalidateBroadcast(updated.uploadedById, updated.subject);

  return updated;
}

module.exports = { getPendingContent, getAllContent, approveContent, rejectContent };
