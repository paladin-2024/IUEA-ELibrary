'use strict';

/**
 * Seed script — populates the database with:
 *   1. Admin user + test student
 *   2. Books from Open Library (with real EPUB/PDF URLs via Internet Archive)
 *   3. Books from Project Gutenberg (free classic EPUBs)
 *   4. Books from DOAB (academic open-access PDFs)
 *
 * Usage:
 *   node scripts/seed.js                  ← append new books
 *   node scripts/seed.js --clear          ← wipe books first, then seed
 *   node scripts/seed.js --books-only     ← skip user seeding
 *
 * Rate limits respected: 500 ms between Open Library / Archive calls.
 */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const axios    = require('axios');
const prisma   = require('../src/config/prisma');

const CLEAR      = process.argv.includes('--clear');
const BOOKS_ONLY = process.argv.includes('--books-only');

const OL_BASE    = 'https://openlibrary.org';
const ARCH_BASE  = 'https://archive.org';
const GUTEN_BASE = 'https://gutendex.com/books';
const DOAB_BASE  = 'https://www.doabooks.org/api/1';

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function olCover(coverId, size = 'L') {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null;
}

function pick(arr) {
  if (!arr) return null;
  return Array.isArray(arr) ? arr[0] : arr;
}

function cleanTitle(t) {
  return (t ?? '').replace(/\s*\/.*$/, '').replace(/\s*:.*$/, (m) => m).trim();
}

function buildDescription(subjects, category) {
  const tops = (subjects ?? [])
    .filter((s) => typeof s === 'string' && s.length < 60)
    .slice(0, 4)
    .join(', ');
  if (tops.length > 8) return `Topics: ${tops}.`;
  return `An academic text covering ${category.toLowerCase()} studies.`;
}

// IUEA faculty list
const FACULTY_MAP = {
  Engineering:     ['electrical', 'civil', 'mechanical', 'structural', 'construction', 'engineering', 'telecommunication'],
  IT:              ['computer', 'software', 'programming', 'network', 'database', 'algorithm', 'data structure', 'artificial intelligence', 'machine learning', 'cybersecurity', 'information technology', 'web'],
  Business:        ['business', 'management', 'accounting', 'finance', 'marketing', 'entrepreneurship', 'human resource', 'strategic', 'economics', 'microeconomics', 'macroeconomics'],
  Law:             ['law', 'legal', 'constitution', 'jurisprudence', 'criminal', 'commercial law', 'contract'],
  Medicine:        ['medicine', 'medical', 'health', 'nursing', 'pharmacology', 'anatomy', 'physiology', 'clinical', 'public health', 'epidemiology'],
  'Social Sciences':['sociology', 'social', 'political', 'history', 'africa', 'uganda', 'anthropology', 'development', 'governance', 'international relations'],
  Education:       ['education', 'teaching', 'pedagogy', 'curriculum', 'learning', 'literacy'],
  Science:         ['biology', 'chemistry', 'physics', 'mathematics', 'statistics', 'ecology', 'environment', 'botany', 'zoology'],
};

function detectFaculty(fields) {
  const haystack = fields
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  for (const [faculty, keywords] of Object.entries(FACULTY_MAP)) {
    if (keywords.some((k) => haystack.includes(k))) return faculty;
  }
  return 'General';
}

// ── Internet Archive — resolve actual EPUB / PDF file URL ─────────────────────

async function resolveArchiveFile(identifier) {
  try {
    const { data } = await axios.get(
      `${ARCH_BASE}/metadata/${identifier}`,
      { timeout: 10000 },
    );
    const files = data.files ?? [];

    // Prefer epub, then pdf (skip encrypted / derivative where possible)
    const epub = files.find(
      (f) => f.name?.endsWith('.epub') && !f.name.includes('_encrypted'),
    );
    if (epub) {
      return {
        url:    `${ARCH_BASE}/download/${identifier}/${epub.name}`,
        format: 'epub',
      };
    }
    const pdf = files.find(
      (f) => f.name?.endsWith('.pdf')
          && f.source !== 'derivative'
          && !f.name.includes('_encrypted'),
    );
    if (pdf) {
      return {
        url:    `${ARCH_BASE}/download/${identifier}/${pdf.name}`,
        format: 'pdf',
      };
    }
  } catch (_) { /* skip */ }
  return null;
}

// ── Open Library ──────────────────────────────────────────────────────────────

const OL_QUERIES = [
  // Engineering
  { q: 'electrical engineering circuits textbook',         category: 'Engineering'     },
  { q: 'civil engineering structural design',              category: 'Engineering'     },
  { q: 'mechanical engineering thermodynamics',            category: 'Engineering'     },
  { q: 'telecommunications network engineering',           category: 'Engineering'     },
  // IT / Computer Science
  { q: 'computer science algorithms data structures',      category: 'IT'              },
  { q: 'software engineering design patterns',             category: 'IT'              },
  { q: 'database management systems SQL',                  category: 'IT'              },
  { q: 'computer networks TCP IP protocols',               category: 'IT'              },
  { q: 'artificial intelligence machine learning python',  category: 'IT'              },
  { q: 'cybersecurity information security',               category: 'IT'              },
  // Business
  { q: 'accounting financial reporting principles',        category: 'Business'        },
  { q: 'marketing management kotler',                      category: 'Business'        },
  { q: 'human resource management practice',              category: 'Business'        },
  { q: 'strategic management business policy',             category: 'Business'        },
  { q: 'entrepreneurship small business Africa',           category: 'Business'        },
  // Law
  { q: 'East African law constitution Uganda',             category: 'Law'             },
  { q: 'commercial law contracts business',                category: 'Law'             },
  { q: 'criminal law procedure justice',                   category: 'Law'             },
  { q: 'international law human rights',                   category: 'Law'             },
  // Medicine / Health Sciences
  { q: 'public health epidemiology Africa',                category: 'Medicine'        },
  { q: 'nursing clinical practice healthcare',             category: 'Medicine'        },
  { q: 'pharmacology drugs therapeutics',                  category: 'Medicine'        },
  { q: 'anatomy physiology human body',                    category: 'Medicine'        },
  // Social Sciences
  { q: 'African history society politics',                 category: 'Social Sciences' },
  { q: 'development economics poverty Africa',             category: 'Social Sciences' },
  { q: 'political science governance democracy',           category: 'Social Sciences' },
  { q: 'sociology community development Uganda',           category: 'Social Sciences' },
  // Education
  { q: 'education curriculum pedagogy Africa',             category: 'Education'       },
  { q: 'teaching methodology classroom instruction',       category: 'Education'       },
  // Science
  { q: 'biology ecology environment Africa',               category: 'Science'         },
  { q: 'chemistry organic inorganic reactions',            category: 'Science'         },
  { q: 'mathematics calculus statistics',                  category: 'Science'         },
];

async function fetchOpenLibrary() {
  const books = [];
  console.log(`   Querying ${OL_QUERIES.length} subjects…`);

  for (const { q, category } of OL_QUERIES) {
    try {
      const { data } = await axios.get(`${OL_BASE}/search.json`, {
        params: {
          q,
          has_fulltext: true,      // only books with digital copies on IA
          limit:        6,
          fields:       'key,title,author_name,cover_i,subject,first_publish_year,ia,number_of_pages_median',
        },
        timeout: 14000,
      });

      let added = 0;
      for (const doc of (data.docs ?? []).slice(0, 6)) {
        if (!doc.title) continue;
        const author   = pick(doc.author_name) ?? 'Unknown';
        const iaId     = pick(doc.ia);         // Internet Archive identifier
        const subjects = (doc.subject ?? []).map(String);

        let fileUrl = null, fileFormat = null;

        if (iaId) {
          const resolved = await resolveArchiveFile(iaId);
          if (resolved) { fileUrl = resolved.url; fileFormat = resolved.format; }
          await sleep(400); // respect archive.org rate limit
        }

        const faculty = detectFaculty([category, ...subjects]);

        books.push({
          title:         cleanTitle(doc.title),
          author,
          description:   buildDescription(subjects, category),
          coverUrl:      olCover(doc.cover_i),
          fileUrl,
          fileFormat:    fileFormat ?? (fileUrl ? 'epub' : null),
          archiveId:     iaId ?? undefined,
          category,
          faculty:       [faculty],
          languages:     ['English'],
          publishedYear: doc.first_publish_year ?? null,
          pageCount:     doc.number_of_pages_median ?? null,
          rating:        +(3.5 + Math.random() * 1.5).toFixed(1),
          ratingCount:   Math.floor(Math.random() * 300) + 20,
          tags:          subjects.slice(0, 6),
          isActive:      true,
        });
        added++;
      }

      process.stdout.write(`\r   [OL] "${q.slice(0, 45).padEnd(45)}" → ${added} books`);
      await sleep(500);
    } catch (err) {
      process.stdout.write(`\n   [OL] "${q}" failed: ${err.message}\n`);
    }
  }

  console.log(`\n   Open Library total: ${books.length} books`);
  return books;
}

// ── Project Gutenberg — public domain EPUBs ───────────────────────────────────

const GUTEN_QUERIES = [
  { q: 'law',               category: 'Law'             },
  { q: 'economics',         category: 'Business'        },
  { q: 'science biology',   category: 'Science'         },
  { q: 'history africa',    category: 'Social Sciences' },
  { q: 'medicine',          category: 'Medicine'        },
  { q: 'mathematics',       category: 'Science'         },
  { q: 'political science', category: 'Social Sciences' },
  { q: 'education',         category: 'Education'       },
];

async function fetchGutenberg() {
  const books = [];
  for (const { q, category } of GUTEN_QUERIES) {
    try {
      const { data } = await axios.get(GUTEN_BASE, {
        params:  { search: q, topic: q },
        timeout: 10000,
      });
      for (const b of (data.results ?? []).slice(0, 5)) {
        const epubUrl = b.formats?.['application/epub+zip'] ?? null;
        const subjects = (b.subjects ?? []).concat(b.bookshelves ?? []);
        const faculty  = detectFaculty([category, ...subjects.map(String)]);

        books.push({
          gutenbergId:  b.id,
          title:         cleanTitle(b.title ?? 'Untitled'),
          author:        b.authors?.[0]?.name ?? 'Unknown',
          description:   buildDescription(subjects, category),
          coverUrl:      b.formats?.['image/jpeg'] ?? null,
          fileUrl:       epubUrl,
          fileFormat:    epubUrl ? 'epub' : null,
          category,
          faculty:       [faculty],
          languages:     ['English'],
          rating:        +(3.2 + Math.random() * 1.8).toFixed(1),
          ratingCount:   Math.floor(Math.random() * 500) + 50,
          tags:          subjects.map(String).slice(0, 6),
          isActive:      true,
        });
      }
      process.stdout.write(`\r   [Gutenberg] "${q.padEnd(25)}" → added`);
      await sleep(250);
    } catch (err) {
      process.stdout.write(`\n   [Gutenberg] "${q}" failed: ${err.message}\n`);
    }
  }
  console.log(`\n   Gutenberg total: ${books.length} books`);
  return books;
}

// ── DOAB — Directory of Open Access Books (academic PDFs) ────────────────────

const DOAB_QUERIES = [
  { q: 'electrical engineering',  category: 'Engineering'     },
  { q: 'computer science',        category: 'IT'              },
  { q: 'management economics',    category: 'Business'        },
  { q: 'law africa',              category: 'Law'             },
  { q: 'public health',           category: 'Medicine'        },
  { q: 'african politics history',category: 'Social Sciences' },
  { q: 'mathematics',             category: 'Science'         },
  { q: 'education',               category: 'Education'       },
];

async function fetchDoab() {
  const books = [];
  for (const { q, category } of DOAB_QUERIES) {
    try {
      const { data } = await axios.get(`${DOAB_BASE}/search`, {
        params:  { query: q, limit: 6, page: 0 },
        timeout: 12000,
      });
      for (const rec of (data?.records ?? []).slice(0, 6)) {
        const title  = pick(rec['dc:title'] ?? rec.dc_title)   ?? null;
        const author = pick(rec['dc:creator'] ?? rec.dc_creator) ?? 'Unknown';
        if (!title) continue;

        // DOAB PDF URL lives in bitstream or dc:relation
        const pdfUrl = rec['BITSTREAM_PDF_URL']
          ?? rec['BITSTREAM_DOWNLOAD_URL']
          ?? pick(rec['dc:relation'])
          ?? null;

        const year     = rec['oapen:year'] ?? rec.oapen_year ?? null;
        const subjects = [
          ...(rec['dc:subject']   ?? rec.dc_subject   ?? []),
          ...(rec['oapen:topic']  ?? rec.oapen_topic  ?? []),
        ].map(String);
        const faculty  = detectFaculty([category, ...subjects]);

        books.push({
          title:         cleanTitle(title),
          author:        Array.isArray(author) ? author.join(', ') : author,
          description:   buildDescription(subjects, category),
          coverUrl:      null, // DOAB has no direct cover URL
          fileUrl:       pdfUrl,
          fileFormat:    pdfUrl ? 'pdf' : null,
          category,
          faculty:       [faculty],
          languages:     ['English'],
          publishedYear: year ? Number(year) : null,
          rating:        +(3.5 + Math.random() * 1.5).toFixed(1),
          ratingCount:   Math.floor(Math.random() * 200) + 10,
          tags:          subjects.slice(0, 6),
          isActive:      true,
        });
      }
      process.stdout.write(`\r   [DOAB] "${q.padEnd(30)}" → added`);
      await sleep(400);
    } catch (err) {
      process.stdout.write(`\n   [DOAB] "${q}" failed: ${err.message}\n`);
    }
  }
  console.log(`\n   DOAB total: ${books.length} books`);
  return books;
}

// ── Internet Archive — direct subject search ──────────────────────────────────

const ARCH_QUERIES = [
  { q: 'electrical engineering open access textbook', category: 'Engineering'     },
  { q: 'software engineering open source textbook',   category: 'IT'              },
  { q: 'Uganda law legal textbook',                   category: 'Law'             },
  { q: 'African economic development policy',         category: 'Business'        },
  { q: 'East Africa health medicine report',          category: 'Medicine'        },
  { q: 'African history society politics',            category: 'Social Sciences' },
  { q: 'mathematics textbook open access',            category: 'Science'         },
];

async function fetchArchive() {
  const books = [];
  for (const { q, category } of ARCH_QUERIES) {
    try {
      const { data } = await axios.get(`${ARCH_BASE}/advancedsearch.php`, {
        params: {
          q:         `(${q}) AND mediatype:texts AND language:English AND subject:textbook`,
          'fl[]':    ['identifier', 'title', 'creator', 'description', 'subject', 'date'],
          rows:      5,
          output:    'json',
          sort:      ['downloads desc'],
        },
        timeout: 12000,
      });

      for (const d of (data?.response?.docs ?? [])) {
        if (!d.title) continue;
        const identifier = d.identifier;
        const resolved   = await resolveArchiveFile(identifier);
        await sleep(500);

        const subjects = Array.isArray(d.subject) ? d.subject : [d.subject ?? ''].filter(Boolean);
        const faculty  = detectFaculty([category, ...subjects.map(String)]);

        const rawYear = d.date ? parseInt(d.date, 10) : null;

        books.push({
          archiveId:    identifier,
          title:        cleanTitle(Array.isArray(d.title)   ? d.title[0]   : d.title),
          author:       Array.isArray(d.creator) ? d.creator[0] : (d.creator ?? 'Unknown'),
          description:  buildDescription(subjects, category),
          coverUrl:     `${ARCH_BASE}/services/img/${identifier}`,
          fileUrl:      resolved?.url ?? null,
          fileFormat:   resolved?.format ?? null,
          category,
          faculty:      [faculty],
          languages:    ['English'],
          publishedYear: isNaN(rawYear) ? null : rawYear,
          rating:       +(3.0 + Math.random() * 2.0).toFixed(1),
          ratingCount:  Math.floor(Math.random() * 200) + 10,
          tags:         subjects.map(String).slice(0, 6),
          isActive:     true,
        });
      }

      process.stdout.write(`\r   [Archive] "${q.slice(0, 40).padEnd(40)}" → added`);
      await sleep(500);
    } catch (err) {
      process.stdout.write(`\n   [Archive] "${q}" failed: ${err.message}\n`);
    }
  }
  console.log(`\n   Archive total: ${books.length} books`);
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
    create: {
      email:        adminEmail,
      name:         'IUEA Admin',
      passwordHash: adminHash,
      role:         'admin',
      faculty:      'Administration',
    },
  });
  console.log(`   Admin:   ${adminEmail}  /  ${adminPass}`);

  await prisma.user.upsert({
    where:  { email: studentEmail },
    update: {},
    create: {
      email:        studentEmail,
      name:         'Test Student',
      passwordHash: stuHash,
      role:         'student',
      faculty:      'Engineering',
      studentId:    'STU-2025-001',
    },
  });
  console.log(`   Student: ${studentEmail}  /  Student@2025!`);
}

// ── Insert books (skip exact title+author duplicates) ─────────────────────────

async function insertBooks(allBooks) {
  // Deduplicate by title+author before hitting the DB
  const seen   = new Set();
  const unique = allBooks.filter((b) => {
    const key = `${b.title}|${b.author}`.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`\n   ${allBooks.length} fetched → ${unique.length} after dedup`);

  let inserted = 0, skipped = 0;

  for (const book of unique) {
    try {
      // Skip if title already exists in the DB (avoids re-runs duplicating data)
      const exists = await prisma.book
        .findFirst({ where: { title: book.title } })
        .catch(() => null);
      if (exists) { skipped++; continue; }

      await prisma.book.create({ data: book });
      inserted++;
      process.stdout.write(`\r   ${inserted} inserted, ${skipped} skipped…`);
    } catch {
      skipped++;
    }
  }

  console.log(`\n   Done — ${inserted} inserted, ${skipped} skipped.`);
  return inserted;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
  console.log('\n📚  IUEA Library — Database Seeder\n');

  if (!BOOKS_ONLY) {
    console.log('👤  Seeding users…');
    await seedUsers();
  }

  if (CLEAR) {
    console.log('\n🗑️   Clearing existing books…');
    await prisma.book.deleteMany({});
    console.log('    Done.');
  }

  console.log('\n📖  Fetching from Open Library (resolving EPUB/PDF links)…');
  const olBooks = await fetchOpenLibrary();

  console.log('\n📖  Fetching from Project Gutenberg (free classic EPUBs)…');
  const gutenBooks = await fetchGutenberg();

  console.log('\n📖  Fetching from DOAB (academic open-access PDFs)…');
  const doabBooks = await fetchDoab();

  console.log('\n📖  Fetching from Internet Archive (direct subject search)…');
  const archBooks = await fetchArchive();

  const allBooks = [...olBooks, ...gutenBooks, ...doabBooks, ...archBooks];

  // Summary table
  const withFile  = allBooks.filter((b) => b.fileUrl).length;
  const withCover = allBooks.filter((b) => b.coverUrl).length;
  console.log(`\n📊  Summary`);
  console.log(`    Total books fetched : ${allBooks.length}`);
  console.log(`    With EPUB/PDF file  : ${withFile}  (${Math.round(withFile / allBooks.length * 100)}%)`);
  console.log(`    With cover image    : ${withCover}`);

  console.log('\n💾  Inserting into database…');
  const inserted = await insertBooks(allBooks);

  console.log(`\n🎉  Seeding complete! ${inserted} new books added.\n`);
}

main()
  .catch((err) => { console.error('Seed failed:', err); process.exit(1); })
  .finally(()  => mongoose.disconnect());
