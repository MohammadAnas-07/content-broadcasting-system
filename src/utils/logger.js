/**
 * src/utils/logger.js
 *
 * Tiny custom logger for application-level events. Morgan handles HTTP logs;
 * this handles everything else (startup, errors, cache hits/misses, etc.).
 *
 * In production you'd swap this for winston or pino, but for this project
 * a lightweight implementation is perfectly sufficient and keeps deps lean.
 */

'use strict';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ANSI colour codes — only used in non-production so CI/log aggregators
// don't get polluted with escape sequences.
const COLOURS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  grey: '\x1b[90m',
};

function colour(str, code) {
  if (IS_PRODUCTION) return str;
  return `${code}${str}${COLOURS.reset}`;
}

function timestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, meta) {
  const ts = colour(timestamp(), COLOURS.grey);
  const lvl = level.toUpperCase().padEnd(5);
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${lvl}] ${message}${metaStr}`;
}

const logger = {
  info(message, meta) {
    console.log(formatMessage(colour('info', COLOURS.green), message, meta));
  },

  warn(message, meta) {
    console.warn(formatMessage(colour('warn', COLOURS.yellow), message, meta));
  },

  error(message, meta) {
    // If meta is an Error object, extract useful fields
    if (meta instanceof Error) {
      meta = { message: meta.message, stack: IS_PRODUCTION ? undefined : meta.stack };
    }
    console.error(formatMessage(colour('error', COLOURS.red), message, meta));
  },

  debug(message, meta) {
    if (IS_PRODUCTION) return; // debug logs are dev-only
    console.log(formatMessage(colour('debug', COLOURS.cyan), message, meta));
  },
};

module.exports = logger;
