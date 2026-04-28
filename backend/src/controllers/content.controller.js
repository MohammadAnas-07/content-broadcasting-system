/**
 * src/controllers/content.controller.js
 *
 * Thin layer: extracts params from req → delegates to service → formats response.
 */

'use strict';

const contentService = require('../services/content.service');
const asyncHandler = require('../utils/asyncHandler');
const { createError } = require('../middlewares/error.middleware');

/**
 * POST /api/content/upload
 * Multipart form. File is processed by Multer before this handler runs.
 * Body text fields are validated by Zod before this handler runs.
 */
const uploadContent = asyncHandler(async (req, res) => {
  // If Multer didn't attach a file (e.g. the 'file' field was omitted), reject early
  if (!req.file) {
    throw createError('File is required. Send an image as the "file" field.', 'VALIDATION_ERROR', 400);
  }

  const {
    title,
    subject,
    description,
    startTime,
    endTime,
    rotationDurationMinutes,
  } = req.body;

  const content = await contentService.createContent({
    teacherId: req.user.id,
    title,
    subject,
    description,
    // Store only the bare filename — see schema comment and architecture-notes.txt
    filePath: req.file.filename,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    startTime,
    endTime,
    rotationDurationMinutes,
  });

  res.status(201).json({
    success: true,
    message: 'Content uploaded successfully and is pending approval',
    data: { content },
  });
});

/**
 * GET /api/content/my-content
 * Query: { page, limit, status, subject }
 */
const getMyContent = asyncHandler(async (req, res) => {
  const { page, limit, status, subject } = req.query;

  const result = await contentService.getMyContent({
    teacherId: req.user.id,
    page,
    limit,
    status,
    subject,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/content/:id
 * Teachers can view own content; principals can view any content.
 */
const getContent = asyncHandler(async (req, res) => {
  const contentId = parseInt(req.params.id, 10);

  if (isNaN(contentId) || contentId < 1) {
    throw createError('Invalid content ID', 'VALIDATION_ERROR', 400);
  }

  const content = await contentService.getContentById(contentId, req.user);

  res.status(200).json({
    success: true,
    data: { content },
  });
});

module.exports = { uploadContent, getMyContent, getContent };
