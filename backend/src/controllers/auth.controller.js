/**
 * src/controllers/auth.controller.js
 *
 * Thin layer: validate → delegate to service → format response.
 * No business logic lives here.
 */

'use strict';

const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/auth/register
 * Body: { name, email, password, role }
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const { user, token } = await authService.register({ name, email, password, role });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user, token },
  });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login({ email, password });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user, token },
  });
});

/**
 * GET /api/auth/me
 * Requires: Bearer token (authenticate middleware sets req.user)
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

module.exports = { register, login, getMe };
