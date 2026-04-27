/**
 * src/middlewares/error.middleware.js
 *
 * Centralised Express error handler. Must be registered LAST in app.js
 * (after all routes) and MUST have exactly 4 parameters (err, req, res, next)
 * so Express recognises it as an error handler.
 *
 * Error response shape:
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Human readable description",
 *     "code": "MACHINE_READABLE_CODE"
 *   }
 * }
 *
 * Stack traces are never returned in production to avoid leaking internals.
 */

'use strict';

const logger = require('../utils/logger');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ── Known application error codes ────────────────────────────────────────────

const HTTP_STATUS = {
  VALIDATION_ERROR: 400,
  INVALID_FILE: 400,
  FILE_TOO_LARGE: 400,
  MISSING_TOKEN: 401,
  INVALID_TOKEN: 401,
  TOKEN_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

/**
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Function} _next - Required parameter signature for Express error handlers
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Log every error (warning level for client errors, error level for server errors)
  const statusCode = err.statusCode || HTTP_STATUS[err.code] || 500;

  if (statusCode >= 500) {
    logger.error(`Unhandled error on ${req.method} ${req.path}`, {
      message: err.message,
      stack: err.stack,
    });
  } else {
    logger.debug(`Client error on ${req.method} ${req.path}`, { message: err.message });
  }

  const responseBody = {
    success: false,
    error: {
      message: err.message || 'An unexpected error occurred',
      code: err.code || 'INTERNAL_ERROR',
    },
  };

  // In development, attach the stack trace for easier debugging
  if (!IS_PRODUCTION && err.stack) {
    responseBody.error.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
}

// ── Factory for typed app errors ──────────────────────────────────────────────

/**
 * Creates a structured application error that the error handler understands.
 *
 * @param {string} message - Human readable description
 * @param {string} code - Machine readable code (maps to an HTTP status above)
 * @param {number} [statusCode] - Override HTTP status if needed
 * @returns {Error}
 */
function createError(message, code = 'INTERNAL_ERROR', statusCode) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode || HTTP_STATUS[code] || 500;
  return err;
}

module.exports = { errorHandler, createError };
