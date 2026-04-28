/**
 * src/server.js
 *
 * Entry point. Starts the HTTP server on the configured PORT.
 * Handles graceful shutdown on SIGTERM so the process drains active
 * connections before exiting (important on Render/Railway deployments).
 */

'use strict';

require('dotenv').config();

const app = require('./app');
const logger = require('./utils/logger');

// Eagerly initialise the DB and Redis connections by importing the singletons.
// If Postgres is unreachable, the error is logged but the process continues so
// the health check endpoint can report the issue rather than silently dying.
require('./config/db');
require('./config/redis');

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(PORT, () => {
  logger.info(`🚀 CBS API server listening on port ${PORT}`);
  logger.info(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  logger.info(`   Health      : http://localhost:${PORT}/health`);
  logger.info(`   Swagger     : http://localhost:${PORT}/api/docs`);
  logger.info(`   Broadcast   : http://localhost:${PORT}/content/live/teacher-1`);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────────

function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  server.close(() => {
    logger.info('HTTP server closed. Exiting.');
    process.exit(0);
  });

  // Force-kill if connections don't drain within 10s
  setTimeout(() => {
    logger.error('Forced shutdown — connections did not drain in time');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled promise rejections to prevent silent failures
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
  // In production, crash the process so the process manager restarts it.
  // Leaving the process in an unknown state is worse than restarting.
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — crashing', err);
  process.exit(1);
});
