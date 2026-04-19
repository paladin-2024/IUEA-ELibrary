/**
 * Seed script — populates the DB with:
 *  1. Admin user + test student
 *  2. ~80 real books from Project Gutenberg (Gutendex API)
 *  3. Triggers podcast RSS seed (5 feeds)
 *
 * Usage:
 *   node prisma/seed.js
 *
 * Prerequisites:
 *   npx prisma db push   (creates tables first)
 */

require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt           = require('bcryptjs');
const axios            = require('axios');

const prisma = new PrismaClient();

const GUTENDEX = 'https://gutendex.com/books';

// Topic queries that map to IUEA faculty categories
const TOPICS = [
  { q: 'science biology chemistry',   category: 'Science',    faculty: 'Science' },
  { q: 'law justice constitution',    category: 'Law',        faculty: 'Law' },
  { q: 'economics business finance',  category: 'Economics',  faculty: 'Economics' },
  { q: 'computer programming technology', category: 'IT',    faculty: 'IT' },
  { q: 'history africa east africa',  category: 'History',    faculty: 'General' },
  { q: 'philosophy ethics logic',     category: 'Philosophy', faculty: 'General' },
  { q: 'literature fiction poetry',   category: 'Literature', faculty: 'General' },
  { q: 'mathematics statistics',      category: 'Mathematics',faculty: 'Science' },
];

async function fetchGutenberg(query, count = 10) {
  try {
    const { data } = await axios.get(GUTENDEX, {
      params:  { search: query, languages: 'en', mime_type: 'application/epub%2Bzip' },
      timeout: 12000,
    });
    return (data.results ?? []).slice(0, count);
  } catch (err) {
    console.warn(`  [gutenberg] Failed for "${query}":`, err.message);
    return [];
  }
}

function mapGutenbergBook(g, category, faculty) {
  const epubUrl  = g.formats?.['application/epub+zip'] ?? null;
  const coverUrl = g.formats?.['image/jpeg'] ?? null;
  const author   = g.authors?.[0]?.name ?? 'Unknown Author';
  const subject  = g.subjects?.[0] ?? category;
  const lang     = g.languages?.[0]?.toUpperCase() ?? 'EN';

  return {
    gutenbergId:  g.id,
    title:        g.title ?? 'Untitled',
    author,
    description:  subject,
    coverUrl,
    fileUrl:      epubUrl,
    fileFormat:   epubUrl ? 'epub' : null,
    category,
    faculty:      faculty ? [faculty] : [],
    tags:         (g.subjects ?? []).slice(0, 5),
    languages:    ['English'],
    publishedYear: null,
    pageCount:    null,
    rating:       parseFloat((3.5 + Math.random() * 1.4).toFixed(1)),
    ratingCount:  g.download_count ?? 0,
    isActive:     true,
  };
}

async function seedBooks() {
  let created = 0;
  let skipped = 0;

  for (const topic of TOPICS) {
    console.log(`  Fetching: ${topic.q}`);
    const results = await fetchGutenberg(topic.q, 10);

    for (const g of results) {
      // Skip books without epub
      const epubUrl = g.formats?.['application/epub+zip'];
      if (!epubUrl) { skipped++; continue; }

      try {
        await prisma.book.upsert({
          where:  { gutenbergId: g.id },
          update: {},
          create: mapGutenbergBook(g, topic.category, topic.faculty),
        });
        created++;
      } catch (err) {
        // Ignore unique constraint violations
        if (!err.message.includes('Unique')) {
          console.warn(`  [book] Skip "${g.title}":`, err.message);
        }
        skipped++;
      }
    }

    // Polite delay between requests
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`  Books: ${created} created, ${skipped} skipped`);
}

async function seedUsers() {
  const adminEmail   = process.env.ADMIN_EMAIL   || 'admin@iuea.ac.ug';
  const adminPass    = process.env.ADMIN_PASSWORD || 'Admin@IUEA2025!';
  const studentEmail = process.env.SEED_STUDENT_EMAIL || 'student@iuea.ac.ug';

  const hash      = await bcrypt.hash(adminPass, 12);
  const stuHash   = await bcrypt.hash('Student@2025!', 12);

  await prisma.user.upsert({
    where:  { email: adminEmail },
    update: { role: 'admin', passwordHash: hash },
    create: {
      email:        adminEmail,
      name:         'IUEA Admin',
      passwordHash: hash,
      role:         'admin',
      faculty:      'Administration',
    },
  });
  console.log(`  Admin user: ${adminEmail} (password: ${adminPass})`);

  await prisma.user.upsert({
    where:  { email: studentEmail },
    update: {},
    create: {
      email:        studentEmail,
      name:         'Test Student',
      passwordHash: stuHash,
      role:         'student',
      faculty:      'Science',
      studentId:    'STU-2025-001',
    },
  });
  console.log(`  Student user: ${studentEmail} (password: Student@2025!)`);
}

async function seedPodcasts() {
  try {
    const { seedPodcasts: seed } = require('../src/services/podcast.service');
    await seed();
    console.log('  Podcasts seeded from RSS feeds.');
  } catch (err) {
    console.warn('  Podcast seed skipped (may already exist):', err.message);
  }
}

async function main() {
  console.log('\n=== IUEA Library Seed ===\n');

  console.log('1. Users…');
  await seedUsers();

  console.log('\n2. Books from Gutenberg…');
  await seedBooks();

  console.log('\n3. Podcasts from RSS…');
  await seedPodcasts();

  console.log('\n=== Done ===\n');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
