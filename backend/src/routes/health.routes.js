/**
 * src/routes/health.routes.js
 *
 * Public health check endpoint. Required by Render, Railway, and most
 * hosting platforms to detect that the service is alive.
 */

'use strict';

const { Router } = require('express');

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Service health check
 *     tags: [Health]
 *     description: Returns service uptime and current timestamp. No auth required.
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 uptime:
 *                   type: number
 *                   description: Seconds since process started
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
