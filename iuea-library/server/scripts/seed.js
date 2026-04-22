'use strict';

/**
 * Seed script — populates the database with:
 *   1. Admin user + test student
 *   2. Books from Open Library, Project Gutenberg, Internet Archive
 *   3. Podcasts from public RSS feeds
 *
 * Usage:
 *   node scripts/seed.js
 *   node scripts/seed.js --clear   (drop all books/podcasts first)
 */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const axios    = require('axios');
const prisma   = require('../src/config/prisma');

const CLEAR  = process.argv.includes('--clear');
const OL     = 'https://openlibrary.org';
const GUTEN  = 'https://gutendex.com/books';
const ARCH   = 'https://archive.org/advancedsearch.php';

// ── Helpers ──────────────────────────────────────────────────────────────────

function olCover(coverId, size = 'L') {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null;
}

function pick(arr) {
  return Array.isArray(arr) ? arr[0] : (arr ?? null);
}

function mapFaculty(category) {
  const c = (category ?? '').toLowerCase();
  if (c.includes('law')  || c.includes('legal') || c.includes('constitut')) return ['Law'];
  if (c.includes('econ') || c.includes('finance') || c.includes('banking')) return ['Economics'];
  if (c.includes('comput') || c.includes('software') || c.includes('program') || c.includes('data')) return ['IT'];
  if (c.includes('medic') || c.includes('health') || c.includes('nurs') || c.includes('pharma')) return ['Medicine'];
  if (c.includes('scien') || c.includes('biolog') || c.includes('chem') || c.includes('phys')) return ['Science'];
  if (c.includes('business') || c.includes('manag') || c.includes('market') || c.includes('account')) return ['Business'];
  if (c.includes('educ') || c.includes('teach') || c.includes('learn')) return ['Education'];
  if (c.includes('histor') || c.includes('africa') || c.includes('ugand')) return ['Social Sciences'];
  return ['General'];
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Open Library ─────────────────────────────────────────────────────────────

const OL_QUERIES = [
  { q: 'East African law',               category: 'Law'            },
  { q: 'constitutional law Africa',       category: 'Law'            },
  { q: 'African economics development',   category: 'Economics'      },
  { q: 'public health Africa Uganda',     category: 'Medicine'       },
  { q: 'computer science algorithms',     category: 'IT'             },
  { q: 'data structures programming',     category: 'IT'             },
  { q: 'African history politics',        category: 'Social Sciences'},
  { q: 'business management Africa',      category: 'Business'       },
  { q: 'environmental science ecology',   category: 'Science'        },
  { q: 'education pedagogy Uganda',       category: 'Education'      },
];

async function fetchOpenLibrary() {
  const books = [];
  for (const { q, category } of OL_QUERIES) {
    try {
      const { data } = await axios.get(`${OL}/search.json`, {
        params: {
          q,
          limit:  8,
          fields: 'key,title,author_name,cover_i,subject,first_publish_year,isbn,number_of_pages_median',
        },
        timeout: 12000,
      });

      for (const doc of (data.docs ?? []).slice(0, 8)) {
        if (!doc.title || !doc.author_name) continue;
        const author = pick(doc.author_name) ?? 'Unknown';
        books.push({
          title:         doc.title,
          author,
          description:   `Academic text on ${category.toLowerCase()} studies.`,
          coverUrl:      olCover(doc.cover_i),
          category,
          faculty:       mapFaculty(category),
          languages:     ['English'],
          publishedYear: doc.first_publish_year ?? null,
          pageCount:     doc.number_of_pages_median ?? null,
          rating:        +(3.5 + Math.random() * 1.5).toFixed(1),
          ratingCount:   Math.floor(Math.random() * 300) + 20,
          tags:          (doc.subject ?? []).slice(0, 5),
          isActive:      true,
        });
      }
      console.log(`  Open Library "${q}" → ${books.slice(-8).length} books`);
      await sleep(300); // be polite to the API
    } catch (err) {
      console.warn(`  Open Library "${q}" failed:`, err.message);
    }
  }
  return books;
}

// ── Project Gutenberg (free EPUBs) ───────────────────────────────────────────

const GUTEN_QUERIES = [
  { q: 'law',      category: 'Law'      },
  { q: 'economics',category: 'Economics'},
  { q: 'science',  category: 'Science'  },
  { q: 'history',  category: 'Social Sciences' },
  { q: 'medicine', category: 'Medicine' },
];

async function fetchGutenberg() {
  const books = [];
  for (const { q, category } of GUTEN_QUERIES) {
    try {
      const { data } = await axios.get(GUTEN, { params: { search: q }, timeout: 10000 });
      for (const b of (data.results ?? []).slice(0, 6)) {
        const epubUrl = b.formats?.['application/epub+zip'] ?? null;
        books.push({
          gutenbergId:  b.id,
          title:         b.title ?? 'Untitled',
          author:        b.authors?.[0]?.name ?? 'Unknown',
          description:   `Classic text from Project Gutenberg on ${category.toLowerCase()}.`,
          coverUrl:      b.formats?.['image/jpeg'] ?? null,
          fileUrl:       epubUrl,
          fileFormat:    epubUrl ? 'epub' : null,
          category,
          faculty:       mapFaculty(category),
          languages:     ['English'],
          rating:        +(3.2 + Math.random() * 1.8).toFixed(1),
          ratingCount:   Math.floor(Math.random() * 500) + 50,
          tags:          (b.subjects ?? []).slice(0, 5),
          isActive:      true,
        });
      }
      console.log(`  Gutenberg "${q}" → fetched books`);
      await sleep(200);
    } catch (err) {
      console.warn(`  Gutenberg "${q}" failed:`, err.message);
    }
  }
  return books;
}

// ── Internet Archive ──────────────────────────────────────────────────────────

const ARCH_QUERIES = [
  { q: 'Uganda law textbook',      category: 'Law'       },
  { q: 'African economic policy',  category: 'Economics' },
  { q: 'East Africa health report',category: 'Medicine'  },
];

async function fetchArchive() {
  const books = [];
  for (const { q, category } of ARCH_QUERIES) {
    try {
      const { data } = await axios.get(ARCH, {
        params: {
          q:         `${q} mediatype:texts`,
          'fl[]':    ['identifier', 'title', 'creator', 'description', 'subject'],
          rows:      5,
          output:    'json',
        },
        timeout: 12000,
      });
      for (const d of (data?.response?.docs ?? [])) {
        if (!d.title) continue;
        books.push({
          archiveId:   d.identifier,
          title:       Array.isArray(d.title)   ? d.title[0]   : d.title,
          author:      Array.isArray(d.creator) ? d.creator[0] : (d.creator ?? 'Unknown'),
          description: Array.isArray(d.description) ? d.description[0] : (d.description ?? null),
          coverUrl:    `https://archive.org/services/img/${d.identifier}`,
          fileUrl:     `https://archive.org/download/${d.identifier}`,
          fileFormat:  'external',
          category,
          faculty:     mapFaculty(category),
          languages:   ['English'],
          rating:      +(3.0 + Math.random() * 2.0).toFixed(1),
          ratingCount: Math.floor(Math.random() * 200) + 10,
          tags:        (Array.isArray(d.subject) ? d.subject : [d.subject ?? '']).filter(Boolean).slice(0, 5),
          isActive:    true,
        });
      }
      console.log(`  Archive "${q}" → fetched`);
      await sleep(300);
    } catch (err) {
      console.warn(`  Archive "${q}" failed:`, err.message);
    }
  }
  return books;
}

// ── Users ─────────────────────────────────────────────────────────────────────

async function seedUsers() {
  const adminEmail   = process.env.ADMIN_EMAIL        || 'cnzabb@gmail.com';
  const adminPass    = process.env.ADMIN_PASSWORD     || 'Admin@IUEA2025!';
  const studentEmail = process.env.SEED_STUDENT_EMAIL || 'student@iuea.ac.ug';

  const adminHash = await bcrypt.hash(adminPass, 12);
  const stuHash   = await bcrypt.hash('Student@2025!', 12);

  await prisma.user.upsert({
    where:  { email: adminEmail },
    update: { passwordHash: adminHash },
    create: { email: adminEmail, name: 'IUEA Admin', passwordHash: adminHash, role: 'admin', faculty: 'Administration' },
  });
  console.log(`   Admin:   ${adminEmail} / ${adminPass}`);

  await prisma.user.upsert({
    where:  { email: studentEmail },
    update: {},
    create: { email: studentEmail, name: 'Test Student', passwordHash: stuHash, role: 'student', faculty: 'Science', studentId: 'STU-2025-001' },
  });
  console.log(`   Student: ${studentEmail} / Student@2025!`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URI;
  if (!uri) { console.error('MONGODB_URI not set in .env'); process.exit(1); }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('\n📚 IUEA Library — Database Seeder\n');

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤 Seeding users…');
  await seedUsers();

  if (CLEAR) {
    console.log('\n🗑️  Clearing existing books…');
    await prisma.book.deleteMany({});
    console.log('   Done.');
  }

  // ── Books ──────────────────────────────────────────────────────────────────
  console.log('\n📖 Fetching books from Open Library…');
  const olBooks    = await fetchOpenLibrary();

  console.log('\n📖 Fetching books from Project Gutenberg…');
  const gutenBooks = await fetchGutenberg();

  console.log('\n📖 Fetching books from Internet Archive…');
  const archBooks  = await fetchArchive();

  const allBooks = [...olBooks, ...gutenBooks, ...archBooks];
  console.log(`\n✅ Total fetched: ${allBooks.length} books`);

  const seen   = new Set();
  const unique = allBooks.filter(b => {
    const key = `${b.title}|${b.author}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`   After dedup: ${unique.length} books`);

  console.log('\n💾 Inserting books…');
  let inserted = 0, skipped = 0;
  for (const book of unique) {
    try {
      const [existing] = await prisma.book.findMany({ where: { title: book.title }, take: 1 }).catch(() => []);
      if (existing) { skipped++; continue; }
      await prisma.book.create({ data: book });
      inserted++;
      process.stdout.write(`\r   ${inserted} inserted, ${skipped} skipped…`);
    } catch {
      skipped++;
    }
  }
  console.log(`\n   Done — ${inserted} books inserted, ${skipped} skipped.\n`);

  console.log('🎉 Seeding complete!\n');
}

main()
  .catch(err => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => mongoose.disconnect());
