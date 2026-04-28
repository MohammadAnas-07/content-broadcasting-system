/**
 * prisma/seed.js
 *
 * Idempotent seed script — safe to run on every deploy because it uses upsert.
 * Creates:
 *   - 1 Principal  : principal@cbs.local / Password123
 *   - 2 Teachers   : teacher1@cbs.local  / Password123
 *                    teacher2@cbs.local  / Password123
 *   - 3 sample APPROVED content items for teacher1 (maths + science subjects)
 *     so the live broadcast endpoint returns data immediately on a fresh deployment.
 *
 * Sample images are tiny 1x1 pixel PNGs committed to uploads/samples/.
 * The seed inserts filePath as the bare filename; express.static serves them.
 */

'use strict';

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

// ─── Helper ────────────────────────────────────────────────────────────────────

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// ─── Ensure sample image files exist ──────────────────────────────────────────

function ensureSampleImages() {
  const samplesDir = path.join(__dirname, '..', 'uploads', 'samples');
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  // A minimal valid 1x1 red PNG (67 bytes) encoded as base64.
  // Using an actual valid PNG header so the file is a real image.
  const TINY_PNG_B64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8' +
    'z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(TINY_PNG_B64, 'base64');

  const samples = [
    'sample-algebra.png',
    'sample-geometry.png',
    'sample-chemistry.png',
  ];

  for (const name of samples) {
    const filePath = path.join(samplesDir, name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, pngBuffer);
      console.log(`  Created sample image: uploads/samples/${name}`);
    }
  }
}

// ─── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting seed...\n');

  ensureSampleImages();

  // Hash the shared demo password once
  const demoPasswordHash = await hashPassword('Password123');

  // ── Users ──────────────────────────────────────────────────────────────────

  const principal = await prisma.user.upsert({
    where: { email: 'principal@cbs.local' },
    update: {},
    create: {
      name: 'Principal Admin',
      email: 'principal@cbs.local',
      passwordHash: demoPasswordHash,
      role: 'PRINCIPAL',
    },
  });
  console.log(`✅ Principal: ${principal.email} (id=${principal.id})`);

  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@cbs.local' },
    update: {},
    create: {
      name: 'Alice Teacher',
      email: 'teacher1@cbs.local',
      passwordHash: demoPasswordHash,
      role: 'TEACHER',
    },
  });
  console.log(`✅ Teacher 1 : ${teacher1.email} (id=${teacher1.id})`);

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@cbs.local' },
    update: {},
    create: {
      name: 'Bob Teacher',
      email: 'teacher2@cbs.local',
      passwordHash: demoPasswordHash,
      role: 'TEACHER',
    },
  });
  console.log(`✅ Teacher 2 : ${teacher2.email} (id=${teacher2.id})\n`);

  // ── Sample content for teacher1 ────────────────────────────────────────────
  // Use a broad time window (2025-01-01 → 2030-12-31) so items are active
  // immediately without having to fiddle with timestamps after cloning.

  const broadWindow = {
    startTime: new Date('2025-01-01T00:00:00Z'),
    endTime: new Date('2030-12-31T23:59:59Z'),
  };

  const sampleContent = [
    {
      title: 'Algebra Worksheet 1',
      subject: 'maths',
      description: 'Introduction to linear equations',
      filePath: 'samples/sample-algebra.png',
      fileType: 'image/png',
      fileSize: 67,
      rotationDurationMinutes: 5,
      ...broadWindow,
    },
    {
      title: 'Geometry Basics',
      subject: 'maths',
      description: 'Shapes, angles, and theorems',
      filePath: 'samples/sample-geometry.png',
      fileType: 'image/png',
      fileSize: 67,
      rotationDurationMinutes: 3,
      ...broadWindow,
    },
    {
      title: 'Chemistry Lab Safety',
      subject: 'science',
      description: 'Lab rules and safety guidelines',
      filePath: 'samples/sample-chemistry.png',
      fileType: 'image/png',
      fileSize: 67,
      rotationDurationMinutes: 5,
      ...broadWindow,
    },
  ];

  for (const item of sampleContent) {
    // Check if a content item with this title/teacher already exists
    const existing = await prisma.content.findFirst({
      where: { title: item.title, uploadedById: teacher1.id },
    });

    if (!existing) {
      const created = await prisma.content.create({
        data: {
          ...item,
          uploadedById: teacher1.id,
          status: 'APPROVED',
          approvedById: principal.id,
          approvedAt: new Date(),
        },
      });
      console.log(`✅ Content seeded: "${created.title}" (${created.subject})`);
    } else {
      console.log(`⏭  Content already exists: "${item.title}" — skipping`);
    }
  }

  console.log('\n🎉 Seed complete!');
  console.log('\nDemo credentials:');
  console.log('  Principal : principal@cbs.local / Password123');
  console.log('  Teacher 1 : teacher1@cbs.local  / Password123');
  console.log('  Teacher 2 : teacher2@cbs.local  / Password123');
  console.log(`\nLive broadcast (after server start): http://localhost:${process.env.PORT || 3000}/content/live/teacher-${teacher1.id}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
