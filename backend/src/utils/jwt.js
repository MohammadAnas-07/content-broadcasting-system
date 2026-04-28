/**
 * src/utils/jwt.js
 *
 * Thin wrappers around jsonwebtoken so the rest of the codebase
 * never imports 'jsonwebtoken' directly. Centralising sign/verify
 * here makes it easy to swap algorithms or add key rotation later.
 */

'use strict';

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is not set. Check your .env file.');
}

/**
 * Signs a JWT containing the given payload.
 *
 * @param {{ id: number, email: string, role: string }} payload
 * @returns {string} Signed JWT string
 */
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verifies a JWT and returns the decoded payload.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 *
 * @param {string} token
 * @returns {{ id: number, email: string, role: string, iat: number, exp: number }}
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
