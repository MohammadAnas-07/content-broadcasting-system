/**
 * src/middlewares/upload.middleware.js
 *
 * Multer configuration for content image uploads.
 *
 * Security decisions:
 * - Validates BOTH mimetype AND file extension. Mimetype alone can be
 *   spoofed by an attacker crafting a multipart form. Checking the extension
 *   adds a second layer of defense.
 * - Generates UUID-based filenames to prevent path traversal, filename
 *   collisions, and exposure of the original client-supplied filename.
 * - Stores ONLY the bare filename (no directory prefix) in the database.
 *   express.static('uploads') at the /uploads path serves the actual bytes.
 * - Max file size is enforced by Multer's limits.fileSize so the check
 *   happens at the streaming layer, not after the entire file lands in memory.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Allowed MIME types and their corresponding valid extensions
const ALLOWED_MIMETYPES = new Set(['image/jpeg', 'image/png', 'image/gif']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif']);

// Ensure the uploads directory exists at module load time
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Disk storage config ───────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (_req, file, cb) => {
    // Extract extension from the ORIGINAL filename (lowercase, sanitised)
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// ── File filter — validates both mimetype AND extension ───────────────────────

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIMETYPES.has(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.has(ext);

  if (mimeOk && extOk) {
    cb(null, true); // Accept the file
  } else {
    // Reject with a typed error so the error middleware can return a clean 400
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    err.message =
      `Invalid file. Allowed types: JPEG, PNG, GIF. ` +
      `Got mimetype="${file.mimetype}" extension="${ext || 'none'}"`;
    cb(err, false);
  }
}

// ── Multer instance ───────────────────────────────────────────────────────────

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1, // Only one file per upload request
  },
});

/**
 * Single-file upload middleware. Field name must be "file".
 * Attach as a route-level middleware before the controller.
 *
 * Multer errors are caught and re-thrown as structured errors
 * so they flow through the centralized error middleware.
 */
function uploadSingle(req, res, next) {
  const multerMiddleware = upload.single('file');

  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    // Convert Multer errors into a format our error handler understands
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: {
            message: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
            code: 'FILE_TOO_LARGE',
          },
        });
      }
      return res.status(400).json({
        success: false,
        error: { message: err.message, code: 'INVALID_FILE' },
      });
    }

    // Unknown error — pass to the global error handler
    next(err);
  });
}

module.exports = { uploadSingle };
