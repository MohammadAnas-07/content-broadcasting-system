/**
 * src/middlewares/auth.middleware.js
 *
 * Verifies the JWT in the Authorization header (Bearer scheme).
 * On success, attaches the decoded payload to req.user so downstream
 * handlers can access { id, email, role } without re-parsing the token.
 *
 * On failure, returns 401 — never 403 (that's the RBAC middleware's job).
 */

'use strict';

const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * Express middleware that enforces JWT authentication.
 * Attaches req.user = { id, email, role } on success.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required. Provide a Bearer token.',
        code: 'MISSING_TOKEN',
      },
    });
  }

  const token = authHeader.slice(7); // Strip "Bearer "

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    logger.debug('JWT verification failed', { error: err.message });

    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      error: {
        message: isExpired ? 'Token has expired. Please log in again.' : 'Invalid token.',
        code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      },
    });
  }
}

module.exports = { authenticate };
