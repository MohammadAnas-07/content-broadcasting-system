/**
 * src/routes/broadcast.routes.js
 *
 * Public endpoints — no authentication required.
 * Rate-limited to 60 req/min per IP.
 */

'use strict';

const { Router } = require('express');
const broadcastController = require('../controllers/broadcast.controller');
const { broadcastLimiter } = require('../middlewares/rateLimit.middleware');

const router = Router();

// Apply rate limiting to all broadcast routes
router.use(broadcastLimiter);

/**
 * @swagger
 * tags:
 *   name: Broadcast (Public)
 *   description: Public content broadcast — no authentication required
 */

/**
 * @swagger
 * /content/live:
 *   get:
 *     summary: Broadcast API discovery endpoint
 *     tags: [Broadcast (Public)]
 *     description: Returns usage instructions and examples for the broadcast API.
 *     responses:
 *       200:
 *         description: Discovery message with example URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 examples:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/', broadcastController.getLiveIndex);

/**
 * @swagger
 * /content/live/teacher-{teacherId}:
 *   get:
 *     summary: Get currently active broadcast content for a teacher
 *     tags: [Broadcast (Public)]
 *     description: |
 *       Returns the currently active content item(s) for a teacher based on the
 *       time-based rotation engine. One item per subject is returned.
 *
 *       This endpoint NEVER returns 404 or an error shape. Empty results are
 *       returned as `{ success: true, data: [], message: "No content available" }`.
 *
 *       Rate limited to 60 requests/minute per IP.
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The teacher's user ID (from the URL pattern teacher-{id})
 *         example: 1
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Optional filter — returns only the active item for this subject
 *         example: maths
 *     responses:
 *       200:
 *         description: Active content item(s) or empty array
 *         content:
 *           application/json:
 *             examples:
 *               hit:
 *                 summary: Content is active
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: 12
 *                       title: Algebra Worksheet 1
 *                       subject: maths
 *                       fileUrl: /uploads/abc123.png
 *                       description: Introduction to linear equations
 *                       rotationOrder: 2
 *                       totalInRotation: 4
 *                       secondsRemainingInSlot: 143
 *               miss:
 *                 summary: No content available
 *                 value:
 *                   success: true
 *                   data: []
 *                   message: No content available
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BroadcastItem'
 *                 message:
 *                   type: string
 *                   description: Present only when data is empty
 */
router.get('/teacher-:teacherId', broadcastController.getLiveForTeacher);

module.exports = router;
