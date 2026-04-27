/**
 * src/controllers/approval.controller.js
 *
 * Thin layer for principal content management endpoints.
 */

'use strict';

const approvalService = require('../services/approval.service');
const asyncHandler = require('../utils/asyncHandler');
const { createError } = require('../middlewares/error.middleware');

/**
 * GET /api/approval/pending
 * Query: { page, limit }
 */
const getPending = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await approvalService.getPendingContent({ page, limit });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/approval/all
 * Query: { page, limit, status, subject, teacherId }
 */
const getAll = asyncHandler(async (req, res) => {
  const { page, limit, status, subject, teacherId } = req.query;
  const result = await approvalService.getAllContent({ page, limit, status, subject, teacherId });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * PATCH /api/approval/:id/approve
 */
const approve = asyncHandler(async (req, res) => {
  const contentId = parseInt(req.params.id, 10);

  if (isNaN(contentId) || contentId < 1) {
    throw createError('Invalid content ID', 'VALIDATION_ERROR', 400);
  }

  const content = await approvalService.approveContent(contentId, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Content approved successfully',
    data: { content },
  });
});

/**
 * PATCH /api/approval/:id/reject
 * Body: { rejectionReason }
 */
const reject = asyncHandler(async (req, res) => {
  const contentId = parseInt(req.params.id, 10);

  if (isNaN(contentId) || contentId < 1) {
    throw createError('Invalid content ID', 'VALIDATION_ERROR', 400);
  }

  const { rejectionReason } = req.body;

  const content = await approvalService.rejectContent(contentId, req.user.id, rejectionReason);

  res.status(200).json({
    success: true,
    message: 'Content rejected',
    data: { content },
  });
});

module.exports = { getPending, getAll, approve, reject };
