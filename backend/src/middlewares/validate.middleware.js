/**
 * src/middlewares/validate.middleware.js
 *
 * Generic Zod validation middleware factory.
 * Validates req.body, req.query, or req.params against a Zod schema,
 * returns 400 with a clean error map on failure.
 *
 * Usage:
 *   router.post('/route', validate(mySchema), handler);
 *   router.get('/route', validate(querySchema, 'query'), handler);
 */

'use strict';

const { ZodError } = require('zod');

/**
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {'body'|'query'|'params'} source - Which part of the request to validate (default 'body')
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return function validationMiddleware(req, res, next) {
    const result = schema.safeParse(req[source]);

    if (result.success) {
      // Replace req[source] with the parsed/transformed data (e.g., trimmed strings, parsed ints)
      req[source] = result.data;
      return next();
    }

    // Build a clean field-level error map from Zod's error list
    const errorMap = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_root';
      errorMap[key] = issue.message;
    }

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        fields: errorMap,
      },
    });
  };
}

module.exports = { validate };
