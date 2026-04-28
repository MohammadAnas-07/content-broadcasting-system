/**
 * src/routes/approval.routes.js
 */

'use strict';

const { Router } = require('express');
const approvalController = require('../controllers/approval.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const { validate } = require('../middlewares/validate.middleware');
const {
  listContentQuerySchema,
  listAllContentQuerySchema,
  rejectContentSchema,
} = require('../validators/content.validator');

const router = Router();

// All approval routes require PRINCIPAL role
router.use(authenticate, requireRole('PRINCIPAL'));

/**
 * @swagger
 * tags:
 *   name: Approval (Principal)
 *   description: Principal content review and approval
 */

/**
 * @swagger
 * /api/approval/pending:
 *   get:
 *     summary: List all pending content (Principal only)
 *     tags: [Approval (Principal)]
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
 *     responses:
 *       200:
 *         description: Paginated list of pending content with teacher info
 *       403:
 *         description: Principals only
 */
router.get('/pending', validate(listContentQuerySchema, 'query'), approvalController.getPending);

/**
 * @swagger
 * /api/approval/all:
 *   get:
 *     summary: List all content with filters (Principal only)
 *     tags: [Approval (Principal)]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, REJECTED] }
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *       - in: query
 *         name: teacherId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Filtered, paginated content list
 */
router.get('/all', validate(listAllContentQuerySchema, 'query'), approvalController.getAll);

/**
 * @swagger
 * /api/approval/{id}/approve:
 *   patch:
 *     summary: Approve a pending content item (Principal only)
 *     tags: [Approval (Principal)]
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
 *         description: Content approved
 *       404:
 *         description: Content not found
 *       409:
 *         description: Content is not in PENDING status (already approved or rejected)
 */
router.patch('/:id/approve', approvalController.approve);

/**
 * @swagger
 * /api/approval/{id}/reject:
 *   patch:
 *     summary: Reject a pending content item with a reason (Principal only)
 *     tags: [Approval (Principal)]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rejectionReason]
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 minLength: 5
 *                 example: Image resolution is too low for display
 *     responses:
 *       200:
 *         description: Content rejected
 *       404:
 *         description: Content not found
 *       409:
 *         description: Content is not in PENDING status
 */
router.patch('/:id/reject', validate(rejectContentSchema), approvalController.reject);

module.exports = router;
