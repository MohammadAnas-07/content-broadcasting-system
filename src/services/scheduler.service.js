/**
 * src/services/scheduler.service.js
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * THE ROTATION ENGINE — the most important file in this codebase
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This service answers the question: "Given a teacher ID and the current
 * moment in time, which content item should be displayed for each subject?"
 *
 * How it works (high level):
 * ──────────────────────────
 * 1. Fetch all APPROVED content for the teacher that has a valid time window
 *    AND is currently active (startTime <= now <= endTime). This filtering
 *    is done at the database level so we never pull inactive rows into memory.
 *
 * 2. Group the eligible items by subject. Each subject rotates independently.
 *
 * 3. For each subject group, sort items by createdAt ascending. The upload
 *    order defines the rotation sequence — the first item uploaded comes up
 *    first, then the second, and so on, cycling indefinitely.
 *
 * 4. Determine the current position in the rotation cycle using a
 *    time-based modulo calculation (see detailed explanation below).
 *
 * 5. Walk the sorted list, accumulating durations, until we find which item
 *    "owns" the current position. That item is active.
 *
 * 6. Return one active item per subject with rotation metadata.
 *
 * The rotation epoch trick:
 * ─────────────────────────
 * We need a stable, deterministic "zero point" for each subject's rotation
 * cycle. We use the EARLIEST createdAt timestamp in the subject group as the
 * epoch. This is better than using startTime because:
 *   a) Items can have different startTime values.
 *   b) createdAt is set once at insert and never changes.
 *   c) If a new item is added later with an earlier startTime, using
 *      startTime as the epoch would phase-shift the entire cycle unexpectedly
 *      for all viewers. Using the earliest createdAt means the cycle can only
 *      be extended, never disrupted.
 *
 * The cycle math:
 * ───────────────
 *   cycleSeconds = sum of (item.rotationDurationMinutes * 60) for all items
 *   epoch        = earliest createdAt in the group, as a Unix timestamp (seconds)
 *   nowSeconds   = Date.now() / 1000
 *   elapsed      = nowSeconds - epoch
 *   position     = elapsed % cycleSeconds    (0 to cycleSeconds - 1)
 *
 * Walk the sorted items, accumulating [start, end) duration windows, until
 * position falls inside one. That's the active item.
 *
 * Dynamic eligibility note (documented in architecture-notes.txt):
 * ────────────────────────────────────────────────────────────────
 * Items enter and leave eligibility as time crosses their startTime/endTime
 * boundaries. When the eligible set changes (an item expires or a new one
 * becomes active), the cycle resets — not to a wall clock zero, but in the
 * sense that the eligible group itself is now different. This is correct
 * per the spec and is not a bug. The rotation always reflects "who is
 * currently eligible" and cycles through them in upload order.
 */

'use strict';

const prisma = require('../config/db');
const logger = require('../utils/logger');

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns the currently active content item(s) for a given teacher.
 * One item per subject is returned (each subject rotates independently).
 *
 * @param {number} teacherId         - The teacher's user ID
 * @param {string|null} [subject]    - Optional subject filter (already lowercased)
 * @returns {Promise<Array>}         - Array of active content items with rotation metadata
 */
async function getActiveContentForTeacher(teacherId, subject = null) {
  const now = new Date(); // UTC — Prisma DateTime is always UTC

  // ── Step 1: Database query ──────────────────────────────────────────────────
  // All heavy filtering is done in SQL to avoid pulling large datasets into JS.
  // We filter for:
  //   - The correct teacher
  //   - APPROVED status only
  //   - startTime and endTime both present (without them, items are never active)
  //   - Currently within the active window (startTime <= now <= endTime)
  //   - Optionally, a specific subject

  const whereClause = {
    uploadedById: teacherId,
    status: 'APPROVED',
    startTime: { not: null, lte: now }, // startTime exists AND is in the past
    endTime: { not: null, gte: now },   // endTime exists AND is in the future
  };

  if (subject) {
    whereClause.subject = subject.toLowerCase();
  }

  let eligibleItems;
  try {
    eligibleItems = await prisma.content.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        subject: true,
        description: true,
        filePath: true,
        rotationDurationMinutes: true,
        createdAt: true,
        // We don't need uploadedBy or other heavy relations here
      },
      orderBy: { createdAt: 'asc' }, // Pre-sort at DB level; we re-sort per group in JS
    });
  } catch (err) {
    logger.error('Scheduler DB query failed', { teacherId, subject, error: err.message });
    return []; // Fail gracefully — return empty rather than crashing
  }

  // ── Step 2: Early exit if nothing is eligible ───────────────────────────────

  if (eligibleItems.length === 0) {
    logger.debug('No eligible content for teacher', { teacherId, subject });
    return [];
  }

  // ── Step 3: Group by subject ────────────────────────────────────────────────
  // We use a Map to preserve insertion order (important for determinism).

  /** @type {Map<string, Array>} */
  const groupsBySubject = new Map();

  for (const item of eligibleItems) {
    const subj = item.subject; // Already lowercase from DB constraint
    if (!groupsBySubject.has(subj)) {
      groupsBySubject.set(subj, []);
    }
    groupsBySubject.get(subj).push(item);
  }

  // ── Step 4 + 5: For each subject group, determine the active item ────────────

  const results = [];

  for (const [subjectName, items] of groupsBySubject) {
    const activeItem = resolveActiveItem(items, now, subjectName);
    if (activeItem) {
      results.push(activeItem);
    }
  }

  return results;
}

// ─── Rotation resolver ────────────────────────────────────────────────────────

/**
 * Given a group of eligible items for one subject, calculates which item is
 * currently active and how many seconds remain in its slot.
 *
 * Items must already be sorted by createdAt ascending (the DB query does this,
 * but we re-sort defensively here in case the caller passes an unsorted list).
 *
 * @param {Array}  items       - Eligible content items for a single subject
 * @param {Date}   now         - Current UTC timestamp
 * @param {string} subjectName - Subject label (for logging only)
 * @returns {Object|null}      - Formatted active item, or null if something went wrong
 */
function resolveActiveItem(items, now, subjectName) {
  // Sort by createdAt ascending — upload order defines rotation sequence
  const sorted = [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const totalInRotation = sorted.length;

  // ── Compute the total cycle duration in seconds ────────────────────────────

  const cycleSeconds = sorted.reduce((sum, item) => {
    // rotationDurationMinutes defaults to 5 if missing (shouldn't happen, but be defensive)
    const minutes = item.rotationDurationMinutes || 5;
    return sum + minutes * 60;
  }, 0);

  // Defensive guard: if cycle is somehow zero, skip this group
  if (cycleSeconds === 0) {
    logger.warn('Cycle duration is 0 for subject group — skipping', { subject: subjectName });
    return null;
  }

  // ── Determine the rotation epoch ───────────────────────────────────────────
  // Use the earliest createdAt in the group (already first element after sort).
  // Convert to Unix seconds (integer) for cleaner arithmetic.

  const epochSeconds = Math.floor(new Date(sorted[0].createdAt).getTime() / 1000);
  const nowSeconds = Math.floor(now.getTime() / 1000);

  // elapsed can be negative if the server clock drifts or the epoch is in the future.
  // The modulo handles this: in JS, (-n % m) can be negative, so we normalise.
  const elapsed = nowSeconds - epochSeconds;
  const positionInCycle = ((elapsed % cycleSeconds) + cycleSeconds) % cycleSeconds;

  logger.debug('Rotation calc', {
    subject: subjectName,
    epochSeconds,
    nowSeconds,
    cycleSeconds,
    positionInCycle,
  });

  // ── Walk the sorted items to find which one owns positionInCycle ───────────
  //
  // Example with 3 items at 5, 3, 5 minutes respectively:
  //   Item A owns positions [0,   300)   (0 to 4:59)
  //   Item B owns positions [300, 480)   (5:00 to 7:59)
  //   Item C owns positions [480, 780)   (8:00 to 12:59)
  //   Then the cycle repeats.
  //
  // If positionInCycle = 400, item B is active.
  // secondsRemainingInSlot = 480 - 400 = 80 seconds.

  let cumulative = 0;

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const slotSeconds = (item.rotationDurationMinutes || 5) * 60;

    const slotStart = cumulative;
    const slotEnd = cumulative + slotSeconds;

    if (positionInCycle >= slotStart && positionInCycle < slotEnd) {
      const secondsRemainingInSlot = slotEnd - positionInCycle;

      return {
        id: item.id,
        title: item.title,
        subject: item.subject,
        // Construct the public URL — express.static('uploads') at /uploads serves the file
        fileUrl: `/uploads/${item.filePath}`,
        description: item.description || null,
        rotationOrder: i + 1,       // 1-based index in the rotation sequence
        totalInRotation,
        secondsRemainingInSlot,
      };
    }

    cumulative = slotEnd;
  }

  // This should never happen if cycleSeconds > 0 and positionInCycle is in [0, cycleSeconds),
  // but return null defensively rather than throwing.
  logger.warn('Failed to resolve active item — position out of range', {
    subject: subjectName,
    positionInCycle,
    cycleSeconds,
  });
  return null;
}

module.exports = { getActiveContentForTeacher };
