/**
 * src/middlewares/rbac.middleware.js
 *
 * Role-Based Access Control middleware factory.
 * Must run AFTER authenticate() because it reads req.user.role.
 *
 * Usage:
 *   router.get('/admin', authenticate, requireRole('PRINCIPAL'), handler);
 *   router.post('/upload', authenticate, requireRole('TEACHER'), handler);
 */

'use strict';

/**
 * Returns an Express middleware that restricts access to users with one of
 * the allowed roles. Pass one or more role strings.
 *
 * @param {...string} allowedRoles - e.g. requireRole('PRINCIPAL') or requireRole('PRINCIPAL', 'TEACHER')
 * @returns {Function} Express middleware
 */
function requireRole(...allowedRoles) {
  return function rbacMiddleware(req, res, next) {
    // authenticate() must have run first — if req.user is missing something went wrong
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthenticated', code: 'UNAUTHENTICATED' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
          code: 'FORBIDDEN',
        },
      });
    }

    next();
  };
}

module.exports = { requireRole };
