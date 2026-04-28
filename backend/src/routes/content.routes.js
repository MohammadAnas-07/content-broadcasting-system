/**
 * src/routes/content.routes.js
 */

'use strict';

const { Router } = require('express');
const contentController = require('../controllers/content.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const { uploadSingle } = require('../middlewares/upload.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  uploadContentSchema,
  listContentQuerySchema,
} = require('../validators/content.validator');

const router = Router();

// All content routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Content (Teacher)
 *   description: Teacher content management
 */

/**
 * @swagger
 * /api/content/upload:
 *   post:
 *     summary: Upload a new content item (Teacher only)
 *     tags: [Content (Teacher)]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, subject, file]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Algebra Worksheet 1
 *               subject:
 *                 type: string
 *                 example: maths
 *               description:
 *                 type: string
 *                 example: Introduction to linear equations
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-01-01T00:00:00Z"
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2030-12-31T23:59:59Z"
 *               rotationDurationMinutes:
 *                 type: integer
 *                 example: 5
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, or GIF). Max 10MB.
 *     responses:
 *       201:
 *         description: Content uploaded, pending approval
 *       400:
 *         description: Validation error or invalid file type/size
 *       403:
 *         description: Teachers only
 */
router.post(
  '/upload',
  requireRole('TEACHER'),
  uploadSingle,                         // Multer processes the multipart form
  validate(uploadContentSchema, 'body'), // Zod validates the extracted text fields
  contentController.uploadContent
);

/**
 * @swagger
 * /api/content/my-content:
 *   get:
 *     summary: List own content (Teacher only)
 *     tags: [Content (Teacher)]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated content list
 *       403:
 *         description: Teachers only
 */
router.get(
  '/my-content',
  requireRole('TEACHER'),
  validate(listContentQuerySchema, 'query'),
  contentController.getMyContent
);

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Get a single content item
 *     tags: [Content (Teacher)]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Content details
 *       403:
 *         description: Teachers can only view their own content
 *       404:
 *         description: Content not found
 */
router.get('/:id', requireRole('TEACHER', 'PRINCIPAL'), contentController.getContent);

module.exports = router;
