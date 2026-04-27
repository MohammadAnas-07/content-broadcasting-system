/**
 * src/services/auth.service.js
 *
 * Business logic for authentication.
 * Controllers stay thin; this is where the actual work happens.
 */

'use strict';

const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { signToken } = require('../utils/jwt');
const { createError } = require('../middlewares/error.middleware');

/**
 * Registers a new user (TEACHER or PRINCIPAL).
 * Rejects duplicate emails with a 409 Conflict.
 *
 * @param {{ name: string, email: string, password: string, role: string }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
async function register({ name, email, password, role }) {
  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw createError('An account with this email already exists.', 'CONFLICT', 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return { user, token };
}

/**
 * Authenticates a user and returns a JWT.
 *
 * Security note: both wrong-password and non-existent-email return the same
 * 401 with "Invalid credentials" to prevent email enumeration by attackers.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ user: object, token: string }>}
 */
async function login({ email, password }) {
  // Intentionally look up by email first without revealing whether it exists
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Still call comparePassword with a dummy hash to prevent timing attacks
    // that could reveal whether the email exists based on response time.
    await comparePassword(password, '$2b$10$invalidhashinvalidhashxx');
    throw createError('Invalid credentials', 'INVALID_TOKEN', 401);
  }

  const passwordMatch = await comparePassword(password, user.passwordHash);

  if (!passwordMatch) {
    throw createError('Invalid credentials', 'INVALID_TOKEN', 401);
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  };
}

/**
 * Returns the full user record for a given user ID.
 * Used by GET /api/auth/me after the JWT has been verified.
 *
 * @param {number} userId
 * @returns {Promise<object>}
 */
async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    throw createError('User not found', 'NOT_FOUND', 404);
  }

  return user;
}

module.exports = { register, login, getMe };
