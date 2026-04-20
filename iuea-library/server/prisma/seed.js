/**
 * Seed script — populates the DB with:
 *  1. Admin user + test student
 *  2. Books from two live APIs:
 *       • Gutendex  (gutendex.com)   — Project Gutenberg, real EPUBs
 *       • Open Library (openlibrary.org) — Internet Archive full-text books
 *  3. Podcast RSS feeds
 *
 * Both APIs are free, require no key, and return hundreds of books per run.
 *
 * Usage:  node prisma/seed.js   (from server/ directory)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const axios    = require('axios');
const prisma   = require('../src/config/prisma');

// ── Config ────────────────────────────────────────────────────────────────────
const BOOKS_PER_TOPIC   = 20;   // books fetched per topic per source
const GUTENDEX_PAGES    = 2;    // pages to fetch from Gutendex per topic
const OL_PAGES          = 2;    // pages to fetch from Open Library per topic
const REQUEST_DELAY_MS  = 300;  // delay between API calls (be polite)
const TIMEOUT_MS        = 20000;

// ── Topics mapped to IUEA faculties ──────────────────────────────────────────
const TOPICS = [
  { q: 'science biology chemistry',              category: 'Science',               faculty: 'Science'      },
  { q: 'physics mechanics thermodynamics',        category: 'Science',               faculty: 'Science'      },
  { q: 'mathematics algebra calculus statistics', category: 'Mathematics',           faculty: 'Science'      },
  { q: 'logic probability geometry',              category: 'Mathematics',           faculty: 'Science'      },
  { q: 'law justice constitution rights',         category: 'Law',                   faculty: 'Law'          },
  { q: 'criminal law jurisprudence',              category: 'Law',                   faculty: 'Law'          },
  { q: 'economics business finance trade',        category: 'Economics',             faculty: 'Business'     },
  { q: 'management marketing accounting',         category: 'Business',              faculty: 'Business'     },
  { q: 'computer programming technology',         category: 'Computer Science',      faculty: 'Technology'   },
  { q: 'artificial intelligence machine learning',category: 'Computer Science',      faculty: 'Technology'   },
  { q: 'engineering mechanics civil construction',category: 'Engineering',           faculty: 'Engineering'  },
  { q: 'electrical engineering electronics',      category: 'Engineering',           faculty: 'Engineering'  },
  { q: 'petroleum oil gas geology',               category: 'Petroleum Engineering', faculty: 'Engineering'  },
  { q: 'politics government democracy society',   category: 'Politics',              faculty: 'Politics'     },
  { q: 'international relations diplomacy',       category: 'Politics',              faculty: 'Politics'     },
  { q: 'history africa east africa colonialism',  category: 'History',               faculty: 'General'      },
  { q: 'world history civilisation ancient',      category: 'History',               faculty: 'General'      },
  { q: 'philosophy ethics logic morality',        category: 'Philosophy',            faculty: 'General'      },
  { q: 'literature fiction novel poetry',         category: 'Literature',            faculty: 'General'      },
  { q: 'medicine health anatomy physiology',      category: 'Medicine',              faculty: 'Medicine'     },
  { q: 'psychology human behaviour sociology',    category: 'Psychology',            faculty: 'General'      },
  { q: 'education teaching learning pedagogy',    category: 'Education',             faculty: 'General'      },
  { q: 'religion theology spirituality',          category: 'Religion',              faculty: 'General'      },
  { q: 'art music culture humanities',            category: 'Arts',                  faculty: 'General'      },
  { q: 'environment ecology sustainability',      category: 'Science',               faculty: 'Science'      },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withRetry(fn, label, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) {
        console.warn(`  [skip] ${label}: ${err.message}`);
        return null;
      }
      await sleep(800 * (i + 1));
    }
  }
}

// ── Gutendex source ───────────────────────────────────────────────────────────
async function fetchGutendex(query, page = 1) {
  const res = await axios.get('https://gutendex.com/books', {
    params:  { search: query, languages: 'en', page },
    timeout: TIMEOUT_MS,
  });
  return res.data.results ?? [];
}

function mapGutendexBook(g, category, faculty) {
  const epubUrl  = g.formats?.['application/epub+zip'] ?? null;
  const coverUrl = g.formats?.['image/jpeg']            ?? null;
  if (!epubUrl) return null;
  return {
    gutenbergId:  g.id,
    title:        g.title ?? 'Untitled',
    author:       g.authors?.[0]?.name ?? 'Unknown Author',
    description:  (g.subjects?.[0] ?? category).substring(0, 500),
    coverUrl,
    fileUrl:      epubUrl,
    fileFormat:   'epub',
    category,
    faculty:      [faculty],
    tags:         (g.subjects ?? []).slice(0, 5),
    languages:    (g.languages ?? ['en']).map(l => l === 'en' ? 'English' : l),
    publishedYear: null,
    rating:       parseFloat((3.5 + Math.random() * 1.4).toFixed(1)),
    ratingCount:  g.download_count ?? 0,
    isActive:     true,
  };
}

async function seedFromGutendex(topic, stats) {
  for (let page = 1; page <= GUTENDEX_PAGES; page++) {
    const results = await withRetry(
      () => fetchGutendex(topic.q, page),
      `Gutendex "${topic.q}" p${page}`,
    ) ?? [];

    for (const g of results.slice(0, BOOKS_PER_TOPIC)) {
      const book = mapGutendexBook(g, topic.category, topic.faculty);
      if (!book) { stats.skipped++; continue; }
      try {
        await prisma.book.upsert({
          where:  { gutenbergId: book.gutenbergId },
          update: {},
          create: book,
        });
        stats.created++;
      } catch {
        stats.skipped++;
      }
    }
    await sleep(REQUEST_DELAY_MS);
  }
}

// ── Open Library source ───────────────────────────────────────────────────────
async function fetchOpenLibrary(query, page = 1) {
  const res = await axios.get('https://openlibrary.org/search.json', {
    params: {
      q:            query,
      has_fulltext: 'true',
      language:     'eng',
      limit:        50,
      page,
      fields:       'key,title,author_name,first_publish_year,subject,cover_i,ia,edition_count',
    },
    timeout: TIMEOUT_MS,
  });
  return res.data.docs ?? [];
}

function mapOpenLibraryBook(doc, category, faculty) {
  if (!doc.ia?.length || !doc.cover_i) return null;
  const iaId = doc.ia[0];
  return {
    archiveId:    iaId,
    title:        doc.title ?? 'Untitled',
    author:       doc.author_name?.[0] ?? 'Unknown Author',
    description:  (doc.subject?.[0] ?? category).substring(0, 500),
    coverUrl:     `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
    fileUrl:      `https://archive.org/download/${iaId}/${iaId}.epub`,
    fileFormat:   'epub',
    category,
    faculty:      [faculty],
    tags:         (doc.subject ?? []).slice(0, 5),
    languages:    ['English'],
    publishedYear: doc.first_publish_year ?? null,
    rating:       parseFloat((3.2 + Math.random() * 1.6).toFixed(1)),
    ratingCount:  (doc.edition_count ?? 1) * 10,
    isActive:     true,
  };
}

async function seedFromOpenLibrary(topic, stats) {
  for (let page = 1; page <= OL_PAGES; page++) {
    const results = await withRetry(
      () => fetchOpenLibrary(topic.q, page),
      `OpenLibrary "${topic.q}" p${page}`,
    ) ?? [];

    for (const doc of results.slice(0, BOOKS_PER_TOPIC)) {
      const book = mapOpenLibraryBook(doc, topic.category, topic.faculty);
      if (!book) { stats.skipped++; continue; }
      try {
        await prisma.book.upsert({
          where:  { archiveId: book.archiveId },
          update: {},
          create: book,
        });
        stats.created++;
      } catch {
        stats.skipped++;
      }
    }
    await sleep(REQUEST_DELAY_MS);
  }
}

// ── Main book seed ────────────────────────────────────────────────────────────
async function seedBooks() {
  const stats = { created: 0, skipped: 0 };

  for (const topic of TOPICS) {
    process.stdout.write(`  [${topic.faculty}] ${topic.q} … `);
    const before = stats.created;

    await seedFromGutendex(topic, stats);
    await seedFromOpenLibrary(topic, stats);

    console.log(`+${stats.created - before} books`);
  }

  console.log(`\n  Total: ${stats.created} created, ${stats.skipped} skipped`);
}

// ── Users ─────────────────────────────────────────────────────────────────────
async function seedUsers() {
  const adminEmail   = process.env.ADMIN_EMAIL        || 'admin@iuea.ac.ug';
  const adminPass    = process.env.ADMIN_PASSWORD     || 'Admin@IUEA2025!';
  const studentEmail = process.env.SEED_STUDENT_EMAIL || 'student@iuea.ac.ug';

  const hash    = await bcrypt.hash(adminPass, 12);
  const stuHash = await bcrypt.hash('Student@2025!', 12);

  await prisma.user.upsert({
    where:  { email: adminEmail },
    update: { passwordHash: hash },
    create: { email: adminEmail, name: 'IUEA Admin', passwordHash: hash, role: 'admin', faculty: 'Administration' },
  });
  console.log(`  Admin:   ${adminEmail} / ${adminPass}`);

  await prisma.user.upsert({
    where:  { email: studentEmail },
    update: {},
    create: { email: studentEmail, name: 'Test Student', passwordHash: stuHash, role: 'student', faculty: 'Science', studentId: 'STU-2025-001' },
  });
  console.log(`  Student: ${studentEmail} / Student@2025!`);
}

// ── Podcasts ──────────────────────────────────────────────────────────────────
async function seedPodcasts() {
  try {
    const { seedPodcasts: seed } = require('../src/services/podcast.service');
    await seed();
    console.log('  Podcasts seeded from RSS feeds.');
  } catch (err) {
    console.warn('  Podcast seed skipped:', err.message);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URI;
  if (!uri) { console.error('MONGODB_URI not set in .env'); process.exit(1); }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected.\n=== IUEA Library Seed ===\n');

  console.log('1. Users…');
  await seedUsers();

  console.log(`\n2. Books (Gutendex + Open Library — ${TOPICS.length} topics × ${GUTENDEX_PAGES + OL_PAGES} pages each)…`);
  await seedBooks();

  console.log('\n3. Podcasts…');
  await seedPodcasts();

  console.log('\n=== Done ===');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => mongoose.disconnect());
