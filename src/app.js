/**
 * src/app.js
 *
 * Express application setup. Wires together all middleware, routes, and the
 * Swagger UI. Does NOT call app.listen() — that lives in server.js so that
 * the app can be imported in tests without starting the HTTP server.
 */

'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');
const { errorHandler } = require('./middlewares/error.middleware');

// Route modules
const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const approvalRoutes = require('./routes/approval.routes');
const broadcastRoutes = require('./routes/broadcast.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

// ── Trust proxy (required for accurate IP in rate limiter behind Render/Railway) ──
app.set('trust proxy', 1);

// ── Global middleware ──────────────────────────────────────────────────────────

// CORS — allow all origins so the broadcast endpoint works from any browser/client
app.use(cors());

// HTTP request logging (Morgan)
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (for forms, though most endpoints use JSON/multipart)
app.use(express.urlencoded({ extended: true }));

// ── Static file serving ────────────────────────────────────────────────────────
// Serve uploaded files at /uploads/<filename>. This is what makes fileUrl
// in the broadcast response resolve to an actual downloadable image.
// Cache-Control header encourages browsers to cache static assets.
app.use(
  '/uploads',
  express.static(path.resolve(process.env.UPLOAD_DIR || './uploads'), {
    maxAge: '5m', // Cache-Control: public, max-age=300
    etag: true,
  })
);

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/approval', approvalRoutes);

// Public broadcast endpoint — mounted at /content (not /api/content) per spec
app.use('/content/live', broadcastRoutes);

// Health check
app.use('/health', healthRoutes);

// ── Swagger UI ─────────────────────────────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'CBS API Docs',
    swaggerOptions: {
      persistAuthorization: true, // Keep the JWT token across page refreshes
    },
  })
);

// Expose the raw OpenAPI JSON spec for clients that want to import it
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── 404 handler ───────────────────────────────────────────────────────────────
// Catches any unmatched routes before the error handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
});

// ── Centralized error handler ─────────────────────────────────────────────────
// Must be last — Express identifies error handlers by the 4-parameter signature
app.use(errorHandler);

module.exports = app;
