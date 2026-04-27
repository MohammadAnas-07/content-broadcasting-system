/**
 * src/utils/asyncHandler.js
 *
 * Wraps an async Express route handler so that any rejected promise or thrown
 * error is forwarded to next() — and therefore to the centralized error
 * middleware — without needing try/catch in every controller.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */

'use strict';

/**
 * @param {Function} fn - An async Express handler (req, res, next) => Promise
 * @returns {Function} - A standard Express handler that pipes errors to next()
 */
function asyncHandler(fn) {
  return function asyncWrapper(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
