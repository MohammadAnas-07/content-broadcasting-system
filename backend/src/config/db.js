/**
 * src/config/db.js
 *
 * Prisma client singleton. Importing this module anywhere in the app
 * always returns the same PrismaClient instance, avoiding connection
 * pool exhaustion from multiple instantiations.
 *
 * In development, the client is attached to `global` so that nodemon
 * hot-reloads don't create a new pool on every file change.
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'],
  });
} else {
  // Reuse across hot-reloads in development.
  // Note: Neon free tier drops idle connections after ~5 minutes — this is normal.
  // Prisma reconnects automatically on the next request. We only log 'error' (not 'warn')
  // to avoid the routine "connection closed" noise from Neon's idle timeout.
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error'],
    });
  }
  prisma = global.__prisma;
}

// Verify connection at startup — non-fatal, the health check will surface issues
prisma
  .$connect()
  .then(() => logger.info('PostgreSQL connected via Prisma'))
  .catch((err) => logger.error('PostgreSQL connection failed', err));

module.exports = prisma;
