/**
 * src/utils/bcrypt.js
 *
 * Thin wrappers around bcrypt so the rest of the codebase never
 * imports it directly. SALT_ROUNDS is defined once here.
 */

'use strict';

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Hashes a plain-text password.
 *
 * @param {string} plain
 * @returns {Promise<string>} bcrypt hash
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compares a plain-text password against a stored bcrypt hash.
 *
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
