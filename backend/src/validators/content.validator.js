/**
 * src/validators/content.validator.js
 *
 * Zod schemas for content-related endpoints.
 */

'use strict';

const { z } = require('zod');

// ── Upload (multipart — text fields only; file is validated by Multer) ────────

const uploadContentSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(2, 'Title must be at least 2 characters')
      .max(200, 'Title must be at most 200 characters'),

    subject: z
      .string({ required_error: 'Subject is required' })
      .trim()
      .toLowerCase()
      .min(1, 'Subject cannot be empty'),

    description: z.string().trim().max(1000).optional(),

    startTime: z.string().datetime({ offset: true, message: 'startTime must be a valid ISO-8601 datetime' }).optional(),

    endTime: z.string().datetime({ offset: true, message: 'endTime must be a valid ISO-8601 datetime' }).optional(),

    rotationDurationMinutes: z
      .string()
      .optional()
      .transform((val) => (val !== undefined ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || (Number.isInteger(val) && val >= 1 && val <= 1440), {
        message: 'rotationDurationMinutes must be an integer between 1 and 1440',
      }),
  })
  .refine(
    (data) => {
      // If one of startTime/endTime is provided, both must be provided
      const hasStart = data.startTime !== undefined;
      const hasEnd = data.endTime !== undefined;
      return hasStart === hasEnd; // both or neither
    },
    { message: 'Both startTime and endTime must be provided together, or both omitted' }
  )
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    { message: 'endTime must be after startTime' }
  );

// ── Query params for listing content ─────────────────────────────────────────

const listContentQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .refine((v) => Number.isInteger(v) && v >= 1, { message: 'page must be a positive integer' }),

  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .refine((v) => Number.isInteger(v) && v >= 1 && v <= 100, { message: 'limit must be between 1 and 100' }),

  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),

  subject: z.string().trim().toLowerCase().optional(),
});

// ── Approval query params (adds teacherId filter) ─────────────────────────────

const listAllContentQuerySchema = listContentQuerySchema.extend({
  teacherId: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v > 0), {
      message: 'teacherId must be a positive integer',
    }),
});

// ── Rejection body ────────────────────────────────────────────────────────────

const rejectContentSchema = z.object({
  rejectionReason: z
    .string({ required_error: 'rejectionReason is required' })
    .trim()
    .min(5, 'rejectionReason must be at least 5 characters')
    .max(500, 'rejectionReason must be at most 500 characters'),
});

module.exports = {
  uploadContentSchema,
  listContentQuerySchema,
  listAllContentQuerySchema,
  rejectContentSchema,
};
