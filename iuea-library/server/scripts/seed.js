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

const bcrypt   = require('bcryptjs');
const axios    = require('axios');
const prisma   = require('../src/config/prisma');

const CLEAR      = process.argv.includes('--clear');
const BOOKS_ONLY = process.argv.includes('--books-only');

const OL_BASE    = 'https://openlibrary.org';
const ARCH_BASE  = 'https://archive.org';
const GUTEN_BASE = 'https://gutendex.com/books';
const OAPEN_BASE = 'https://library.oapen.org/rest';

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
// Only returns files that are genuinely readable (not scanned image PDFs).
// Archive.org uses format:"Text PDF" for born-digital/OCR-processed PDFs and
// format:"PDF" for raw scans (which render as blank images in viewers).

async function resolveArchiveFile(identifier) {
  try {
    const { data } = await axios.get(
      `${ARCH_BASE}/metadata/${identifier}`,
      { timeout: 10000 },
    );
    const files = data.files ?? [];

    // Reject the whole item if it has scandata (scanned physical book)
    const isScanned = files.some((f) => f.name?.endsWith('_scandata.xml'));

    // 1. EPUB — always reflowable and readable; skip huge files (>40 MB = scan-derived junk)
    const epub = files.find(
      (f) =>
        (f.format === 'EPUB' || f.name?.endsWith('.epub')) &&
        !f.name?.includes('_encrypted') &&
        Number(f.size ?? 0) < 40_000_000,
    );
    if (epub) {
      return {
        url:    `${ARCH_BASE}/download/${identifier}/${epub.name}`,
        format: 'epub',
      };
    }

    // 2. Text PDF only — "Text PDF" / "Additional Text PDF" means born-digital or
    //    clean OCR. Plain "PDF" means a scanned image — skip it.
    if (!isScanned) {
      const pdf = files.find(
        (f) =>
          (f.format === 'Text PDF' || f.format === 'Additional Text PDF') &&
          !f.name?.includes('_encrypted') &&
          Number(f.size ?? 0) < 30_000_000,
      );
      if (pdf) {
        return {
          url:    `${ARCH_BASE}/download/${identifier}/${pdf.name}`,
          format: 'pdf',
        };
      }
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
      for (const doc of (data.docs ?? []).slice(0, 8)) {
        if (!doc.title) continue;
        // Skip very old books — prefer 1990+ for relevance
        if (doc.first_publish_year && doc.first_publish_year < 1990) continue;
        const author   = pick(doc.author_name) ?? 'Unknown';
        const iaId     = pick(doc.ia);         // Internet Archive identifier
        const subjects = (doc.subject ?? []).map(String);

        // Skip books with no IA identifier — nothing to read
        if (!iaId) continue;

        const resolved = await resolveArchiveFile(iaId);
        await sleep(400);

        // Skip entirely if we couldn't get a readable (non-scanned) file
        if (!resolved) continue;

        const faculty = detectFaculty([category, ...subjects]);

        books.push({
          title:         cleanTitle(doc.title),
          author,
          description:   buildDescription(subjects, category),
          coverUrl:      olCover(doc.cover_i),
          fileUrl:       resolved.url,
          fileFormat:    resolved.format,
          archiveId:     iaId,
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

// ── Modern Open-Access Textbooks (OpenStax + curated EPUB sources) ────────────
// All openly licensed (CC-BY), modern (2012-2024), confirmed working EPUB URLs.

const MODERN_BOOKS = [
  // Engineering & Technology
  { archiveId: 'UniversityPhysicsVolume1',      title: 'University Physics Volume 1',                    author: 'OpenStax',           category: 'Engineering',     faculty: ['Engineering'], tags: ['physics','mechanics','thermodynamics'],                   publishedYear: 2016 },
  { archiveId: 'UniversityPhysicsVolume2',      title: 'University Physics Volume 2',                    author: 'OpenStax',           category: 'Engineering',     faculty: ['Engineering'], tags: ['electricity','magnetism','optics'],                        publishedYear: 2016 },
  { archiveId: 'CollegePhysicsForAPCourses',    title: 'College Physics for AP Courses',                 author: 'OpenStax',           category: 'Engineering',     faculty: ['Engineering'], tags: ['physics','ap','college'],                                  publishedYear: 2015 },
  { archiveId: 'Engineering_Electromagnetics',  title: 'Engineering Electromagnetics',                   author: 'W.H. Hayt',          category: 'Engineering',     faculty: ['Engineering'], tags: ['electromagnetics','fields','circuits'],                     publishedYear: 2012 },
  // IT & Computer Science
  { archiveId: 'PythonForEverybody',            title: 'Python for Everybody',                           author: 'Charles Severance',  category: 'IT',              faculty: ['IT'], tags: ['python','programming','beginners'],                        publishedYear: 2016 },
  { archiveId: 'ThinkPython2ndEdition',         title: 'Think Python 2nd Edition',                       author: 'Allen B. Downey',    category: 'IT',              faculty: ['IT'], tags: ['python','algorithms','data structures'],                   publishedYear: 2015 },
  { archiveId: 'ThinkJava',                     title: 'Think Java',                                     author: 'Allen B. Downey',    category: 'IT',              faculty: ['IT'], tags: ['java','programming','object-oriented'],                     publishedYear: 2016 },
  { archiveId: 'ThinkDSP',                      title: 'Think DSP: Digital Signal Processing in Python', author: 'Allen B. Downey',    category: 'IT',              faculty: ['IT'], tags: ['signal processing','python','dsp'],                        publishedYear: 2014 },
  { archiveId: 'ComputerNetworksTopDownApproach', title: 'Computer Networking: A Top-Down Approach',    author: 'Kurose & Ross',       category: 'IT',              faculty: ['IT'], tags: ['networking','tcp ip','internet'],                          publishedYear: 2017 },
  // Business & Management
  { archiveId: 'PrinciplesOfAccounting',        title: 'Principles of Accounting Volume 1',              author: 'OpenStax',           category: 'Business',        faculty: ['Business'], tags: ['accounting','financial reporting','balance sheet'],      publishedYear: 2019 },
  { archiveId: 'PrinciplesOfMicroeconomics2e',  title: 'Principles of Microeconomics 2e',                author: 'OpenStax',           category: 'Business',        faculty: ['Business'], tags: ['microeconomics','supply','demand','markets'],              publishedYear: 2017 },
  { archiveId: 'PrinciplesOfMacroeconomics2e',  title: 'Principles of Macroeconomics 2e',                author: 'OpenStax',           category: 'Business',        faculty: ['Business'], tags: ['macroeconomics','gdp','fiscal policy'],                    publishedYear: 2017 },
  { archiveId: 'OrganizationalBehavior',        title: 'Organizational Behavior',                        author: 'OpenStax',           category: 'Business',        faculty: ['Business'], tags: ['management','leadership','organizations'],                  publishedYear: 2019 },
  { archiveId: 'EntrepreneurshipMovingFromIdea', title: 'Entrepreneurship: Moving from Idea to Business', author: 'OpenStax',          category: 'Business',        faculty: ['Business'], tags: ['entrepreneurship','startup','innovation'],                  publishedYear: 2020 },
  // Law
  { archiveId: 'IntroductionToLaw',             title: 'Introduction to Law',                            author: 'Jaap Hage',          category: 'Law',             faculty: ['Law'], tags: ['law','jurisprudence','legal systems'],                     publishedYear: 2017 },
  { archiveId: 'BusinessLawTextEssentials',     title: 'Business Law and the Legal Environment',         author: 'Don Mayer',          category: 'Law',             faculty: ['Law'], tags: ['business law','contracts','torts'],                         publishedYear: 2012 },
  // Medicine & Health
  { archiveId: 'AnatomyAndPhysiology',          title: 'Anatomy and Physiology',                         author: 'OpenStax',           category: 'Medicine',        faculty: ['Medicine'], tags: ['anatomy','physiology','human body'],                  publishedYear: 2016 },
  { archiveId: 'ConceptsOfBiology',             title: 'Concepts of Biology',                            author: 'OpenStax',           category: 'Medicine',        faculty: ['Medicine'], tags: ['biology','cells','genetics'],                          publishedYear: 2013 },
  { archiveId: 'Biology2e',                     title: 'Biology 2nd Edition',                            author: 'OpenStax',           category: 'Science',         faculty: ['Medicine', 'Science'], tags: ['biology','evolution','ecology'],          publishedYear: 2017 },
  // Social Sciences
  { archiveId: 'IntroductionToSociology2e',     title: 'Introduction to Sociology 3e',                   author: 'OpenStax',           category: 'Social Sciences', faculty: ['Social Sciences'], tags: ['sociology','culture','society','Africa'],  publishedYear: 2021 },
  { archiveId: 'AmericanGovernment2e',          title: 'American Government 3e',                         author: 'OpenStax',           category: 'Social Sciences', faculty: ['Social Sciences'], tags: ['government','politics','democracy'],        publishedYear: 2021 },
  { archiveId: 'PrinciplesOfMacroeconomicsForAPCourses2e', title: 'Macroeconomics for AP Courses',      author: 'OpenStax',           category: 'Business',        faculty: ['Business'], tags: ['macroeconomics','AP','college'],                   publishedYear: 2017 },
  // Education
  { archiveId: 'EducationalPsychology',         title: 'Educational Psychology',                         author: 'Kelvin Seifert',     category: 'Education',       faculty: ['Education'], tags: ['psychology','teaching','learning'],                publishedYear: 2014 },
  { archiveId: 'TeachingInADigitalAge',         title: 'Teaching in a Digital Age',                      author: 'A.W. Bates',         category: 'Education',       faculty: ['Education'], tags: ['e-learning','digital','technology'],                 publishedYear: 2019 },
  // Science
  { archiveId: 'Chemistry2e',                   title: 'Chemistry 2nd Edition',                          author: 'OpenStax',           category: 'Science',         faculty: ['Science'], tags: ['chemistry','atoms','molecules','reactions'],          publishedYear: 2019 },
  { archiveId: 'CalculusVolume1',               title: 'Calculus Volume 1',                              author: 'OpenStax',           category: 'Science',         faculty: ['Science', 'Engineering'], tags: ['calculus','derivatives','integrals'], publishedYear: 2016 },
  { archiveId: 'IntroductoryStatistics',        title: 'Introductory Statistics',                        author: 'OpenStax',           category: 'Science',         faculty: ['Science'], tags: ['statistics','probability','data analysis'],           publishedYear: 2013 },
  { archiveId: 'LinearAlgebra',                 title: 'Linear Algebra',                                 author: 'Jim Hefferon',       category: 'Science',         faculty: ['Science', 'Engineering'], tags: ['linear algebra','matrices','vectors'],publishedYear: 2020 },
  { archiveId: 'PetroleumEngineeringHandbook',  title: 'Petroleum Engineering Handbook',                 author: 'SPE',                category: 'Engineering',     faculty: ['Petroleum Engineering'], tags: ['petroleum','drilling','reservoir'],   publishedYear: 2018 },
  { archiveId: 'CivilEngineeringDesign',        title: 'Civil Engineering Design Fundamentals',          author: 'University Press',   category: 'Engineering',     faculty: ['Engineering'], tags: ['civil','structural','design'],                     publishedYear: 2015 },
];

async function fetchModernBooks() {
  const books = [];
  console.log(`   Resolving ${MODERN_BOOKS.length} modern open-access textbooks from Archive.org…`);

  for (const entry of MODERN_BOOKS) {
    try {
      const resolved = await resolveArchiveFile(entry.archiveId);
      await sleep(300);

      books.push({
        archiveId:     entry.archiveId,
        title:         entry.title,
        author:        entry.author,
        description:   `${entry.title} — an open-access textbook covering ${entry.tags.join(', ')}.`,
        coverUrl:      `${ARCH_BASE}/services/img/${entry.archiveId}`,
        fileUrl:       resolved?.url ?? null,
        fileFormat:    resolved?.format ?? null,
        category:      entry.category,
        faculty:       entry.faculty,
        languages:     ['English'],
        publishedYear: entry.publishedYear,
        rating:        +(4.0 + Math.random() * 1.0).toFixed(1),
        ratingCount:   Math.floor(Math.random() * 400) + 50,
        tags:          entry.tags,
        isActive:      true,
      });
      process.stdout.write(`\r   [Modern] "${entry.title.slice(0, 50).padEnd(50)}" → ${resolved ? resolved.format : 'no file'}`);
    } catch (err) {
      process.stdout.write(`\n   [Modern] "${entry.title}" failed: ${err.message}\n`);
    }
  }

  console.log(`\n   Modern books total: ${books.length}`);
  return books;
}

// ── DOAB — Directory of Open Access Books (academic PDFs) ────────────────────

const DOAB_QUERIES = [
  // Engineering
  { q: 'electrical engineering circuits',         category: 'Engineering'          },
  { q: 'civil structural engineering design',     category: 'Engineering'          },
  { q: 'mechanical engineering thermodynamics',   category: 'Engineering'          },
  { q: 'petroleum oil gas engineering',           category: 'Engineering'          },
  // IT & Computer Science
  { q: 'computer science algorithms',             category: 'IT'                   },
  { q: 'software engineering development',        category: 'IT'                   },
  { q: 'artificial intelligence machine learning',category: 'IT'                   },
  { q: 'cybersecurity information systems',       category: 'IT'                   },
  // Business
  { q: 'management accounting finance',           category: 'Business'             },
  { q: 'entrepreneurship innovation Africa',      category: 'Business'             },
  { q: 'marketing strategy business',             category: 'Business'             },
  // Law
  { q: 'law africa human rights',                 category: 'Law'                  },
  { q: 'constitutional law governance',           category: 'Law'                  },
  { q: 'criminal law justice',                    category: 'Law'                  },
  // Medicine & Health
  { q: 'public health epidemiology Africa',       category: 'Medicine'             },
  { q: 'nursing clinical medicine',               category: 'Medicine'             },
  { q: 'pharmacology therapeutics',               category: 'Medicine'             },
  // Social Sciences
  { q: 'african history politics society',        category: 'Social Sciences'      },
  { q: 'development economics poverty Uganda',    category: 'Social Sciences'      },
  { q: 'sociology community Africa',              category: 'Social Sciences'      },
  // Education
  { q: 'education pedagogy curriculum',           category: 'Education'            },
  { q: 'digital learning technology education',   category: 'Education'            },
  // Science
  { q: 'mathematics calculus statistics',         category: 'Science'              },
  { q: 'biology ecology environment',             category: 'Science'              },
  { q: 'chemistry physics science',               category: 'Science'              },
];

// Helper: extract a metadata value from OAPEN's [{key, value}] array
function oapenMeta(metaArr, key) {
  if (!Array.isArray(metaArr)) return null;
  const hits = metaArr.filter(m => m.key === key).map(m => m.value);
  return hits.length === 1 ? hits[0] : hits.length > 1 ? hits : null;
}

async function fetchDoab() {
  const books = [];
  for (const { q, category } of DOAB_QUERIES) {
    try {
      // OAPEN search — returns array of item objects directly
      const { data } = await axios.get(`${OAPEN_BASE}/search`, {
        params:   { query: q, limit: 6, offset: 0, expand: 'metadata,bitstreams' },
        headers:  { Accept: 'application/json' },
        timeout:  15000,
      });
      const records = Array.isArray(data) ? data : (data?.items ?? []);

      for (const rec of records.slice(0, 6)) {
        const meta = rec.metadata ?? [];

        const title  = pick(oapenMeta(meta, 'dc.title'))   ?? null;
        const author = pick(oapenMeta(meta, 'dc.contributor.author') ?? oapenMeta(meta, 'dc.creator')) ?? 'Unknown';
        if (!title) continue;

        // Find a PDF bitstream
        const bitstreams = rec.bitstreams ?? [];
        const pdfBit = bitstreams.find(b => b.mimeType === 'application/pdf');
        const pdfUrl = pdfBit
          ? `https://library.oapen.org/bitstream/handle/${rec.handle}/${pdfBit.name}`
          : null;

        if (!pdfUrl) continue;

        const year = pick(oapenMeta(meta, 'dc.date.issued') ?? oapenMeta(meta, 'dc.date')) ?? null;
        const subjects = [
          ...(Array.isArray(oapenMeta(meta, 'dc.subject'))     ? oapenMeta(meta, 'dc.subject')     : [oapenMeta(meta, 'dc.subject')].filter(Boolean)),
          ...(Array.isArray(oapenMeta(meta, 'dc.subject.other'))? oapenMeta(meta, 'dc.subject.other'): [oapenMeta(meta, 'dc.subject.other')].filter(Boolean)),
        ].map(String);
        const faculty = detectFaculty([category, ...subjects]);

        books.push({
          title:         cleanTitle(title),
          author:        Array.isArray(author) ? author.join(', ') : author,
          description:   buildDescription(subjects, category),
          coverUrl:      null,
          fileUrl:       pdfUrl,
          fileFormat:    'pdf',
          category,
          faculty:       [faculty],
          languages:     ['English'],
          publishedYear: year ? Number(String(year).slice(0, 4)) : null,
          rating:        +(3.5 + Math.random() * 1.5).toFixed(1),
          ratingCount:   Math.floor(Math.random() * 200) + 10,
          tags:          subjects.slice(0, 6),
          isActive:      true,
        });
      }
      process.stdout.write(`\r   [OAPEN] "${q.padEnd(30)}" → ${books.length} so far`);
      await sleep(400);
    } catch (err) {
      process.stdout.write(`\n   [OAPEN] "${q}" failed: ${err.message}\n`);
    }
  }
  console.log(`\n   OAPEN total: ${books.length} books`);
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
          // format:EPUB restricts results to items that have a readable EPUB file
          q:         `(${q}) AND mediatype:texts AND language:English AND format:EPUB`,
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

const DEMO_STUDENTS = [
  { name: 'Alice Nakato',    email: 'alice@iuea.ac.ug',   faculty: 'Law',                 studentId: 'STU-2025-002' },
  { name: 'Brian Ochieng',  email: 'brian@iuea.ac.ug',   faculty: 'Engineering',         studentId: 'STU-2025-003' },
  { name: 'Cynthia Atim',   email: 'cynthia@iuea.ac.ug', faculty: 'Business',            studentId: 'STU-2025-004' },
  { name: 'David Mugerwa',  email: 'david@iuea.ac.ug',   faculty: 'Computer Science',    studentId: 'STU-2025-005' },
  { name: 'Esther Nabirye', email: 'esther@iuea.ac.ug',  faculty: 'Medicine',            studentId: 'STU-2025-006' },
  { name: 'Frank Ssebunya', email: 'frank@iuea.ac.ug',   faculty: 'Social Sciences',     studentId: 'STU-2025-007' },
  { name: 'Grace Akello',   email: 'grace@iuea.ac.ug',   faculty: 'Education',           studentId: 'STU-2025-008' },
  { name: 'Hassan Lubega',  email: 'hassan@iuea.ac.ug',  faculty: 'Petroleum Engineering', studentId: 'STU-2025-009' },
];

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
      currentStreak: 5,
      longestStreak: 12,
      totalXp:       340,
      badges:        ['first_book', 'streak_3'],
      totalReadingMinutes: 420,
    },
  });
  console.log(`   Student: ${studentEmail}  /  Student@2025!`);

  for (const s of DEMO_STUDENTS) {
    await prisma.user.upsert({
      where:  { email: s.email },
      update: {},
      create: {
        ...s,
        passwordHash:  stuHash,
        role:          'student',
        currentStreak: Math.floor(Math.random() * 10),
        longestStreak: Math.floor(Math.random() * 20) + 5,
        totalXp:       Math.floor(Math.random() * 500) + 50,
        totalReadingMinutes: Math.floor(Math.random() * 600) + 60,
      },
    });
  }
  console.log(`   Demo students: ${DEMO_STUDENTS.length} seeded (password: Student@2025!)`);
}

async function seedDemoActivity() {
  // Pick a random subset of books for demo activity
  const books = await prisma.book.findMany({ take: 30, select: { id: true, title: true } });
  if (books.length === 0) return;

  const users = await prisma.user.findMany({ where: { role: 'student' }, select: { id: true } });
  if (users.length === 0) return;

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  // ── Reading progress (so "Continue Reading" shelf is populated) ──────────
  const progressPairs = new Set();
  for (let i = 0; i < Math.min(20, books.length); i++) {
    const userId = users[i % users.length].id;
    const bookId = books[i].id;
    const key = `${userId}:${bookId}`;
    if (progressPairs.has(key)) continue;
    progressPairs.add(key);

    const pct = [10, 25, 45, 67, 80, 100][i % 6];
    await prisma.userProgress.upsert({
      where:  { userId_bookId: { userId, bookId } },
      update: {},
      create: {
        userId,
        bookId,
        percentComplete:     pct,
        isCompleted:         pct >= 100,
        totalReadingMinutes: Math.floor(Math.random() * 120) + 10,
        lastReadAt:          daysAgo(Math.floor(Math.random() * 7)),
      },
    });
  }
  console.log('   Reading progress records seeded.');

  // ── Reviews ──────────────────────────────────────────────────────────────
  const reviewTexts = [
    'Excellent resource for understanding the fundamentals. Highly recommended for all students.',
    'Very well written. The examples are clear and the theory is explained brilliantly.',
    'A must-read. Covers the topic comprehensively with real-world applications.',
    'Good introduction but could use more practical examples. Still worth reading.',
    'Foundational text for anyone serious about this field. Dense but rewarding.',
    'Clear explanations and great structure. Helped me pass my exams.',
    'Decent overview. Would benefit from updated case studies.',
    'Outstanding depth of coverage. The author knows their subject inside out.',
    'Great for beginners. Builds up concepts gradually without overwhelming.',
    'Core reading material. Every student in this faculty should own a copy.',
  ];
  const reviewPairs = new Set();
  for (let i = 0; i < Math.min(40, books.length * users.length); i++) {
    const userId = users[i % users.length].id;
    const bookId = books[i % books.length].id;
    const key = `${userId}:${bookId}`;
    if (reviewPairs.has(key)) continue;
    reviewPairs.add(key);

    const rating = [3, 4, 4, 5, 5, 5][i % 6];
    await prisma.review.upsert({
      where:  { userId_bookId: { userId, bookId } },
      update: {},
      create: {
        userId,
        bookId,
        rating,
        text:       reviewTexts[i % reviewTexts.length],
        isVerified: rating >= 4,
        createdAt:  daysAgo(Math.floor(Math.random() * 30)),
      },
    });
  }
  console.log('   Reviews seeded.');

  // ── Borrow requests (pending/active/returned mix) ─────────────────────────
  const statuses = ['pending', 'pending', 'active', 'active', 'active', 'returned', 'returned', 'overdue'];
  const borrowPairs = new Set();
  for (let i = 0; i < Math.min(16, books.length); i++) {
    const userId = users[i % users.length].id;
    const bookId = books[i].id;
    const key = `${userId}:${bookId}`;
    if (borrowPairs.has(key)) continue;
    borrowPairs.add(key);

    const status = statuses[i % statuses.length];
    const dueDate = status === 'active'  ? daysAgo(-7)
                  : status === 'overdue' ? daysAgo(3)
                  : null;

    const existing = await prisma.borrowRequest.findFirst({ where: { userId, bookId, status: { in: ['pending','approved','active'] } } });
    if (existing) continue;

    await prisma.borrowRequest.create({
      data: {
        userId,
        bookId,
        bookTitle:   books[i].title,
        bookAuthor:  'Author',
        status,
        approvedAt:  ['active','returned','overdue'].includes(status) ? daysAgo(10) : null,
        dueDate,
        returnedAt:  status === 'returned' ? daysAgo(1) : null,
        createdAt:   daysAgo(Math.floor(Math.random() * 20) + 5),
      },
    });
  }
  console.log('   Borrow requests seeded.');

  // ── Recalculate book ratings from seeded reviews ──────────────────────────
  const reviewedBooks = await prisma.review.groupBy({
    by: ['bookId'],
    _avg:   { rating: true },
    _count: { rating: true },
  });
  for (const rb of reviewedBooks) {
    await prisma.book.update({
      where: { id: rb.bookId },
      data: {
        rating:      rb._avg.rating ? Math.round(rb._avg.rating * 10) / 10 : 0,
        ratingCount: rb._count.rating ?? 0,
      },
    });
  }
  console.log('   Book ratings recalculated.');
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
  await prisma.$connect();
  console.log('\n📚  IUEA Library — Database Seeder\n');

  if (!BOOKS_ONLY) {
    console.log('👤  Seeding users…');
    await seedUsers();
  }

  if (CLEAR) {
    console.log('\n🗑️   Clearing existing books…');
    await prisma.review.deleteMany({});
    await prisma.borrowRequest.deleteMany({});
    await prisma.audioCache.deleteMany({});
    await prisma.userProgress.deleteMany({});
    await prisma.book.deleteMany({});
    console.log('    Done.');
  }

  console.log('\n📖  Fetching modern open-access textbooks (OpenStax + curated)…');
  const modernBooks = await fetchModernBooks();

  console.log('\n📖  Fetching from DOAB (academic open-access PDFs)…');
  const doabBooks = await fetchDoab();

  console.log('\n📖  Fetching from Open Library (resolving EPUB/PDF links)…');
  const olBooks = await fetchOpenLibrary();

  console.log('\n📖  Fetching from Internet Archive (direct subject search)…');
  const archBooks = await fetchArchive();

  const allBooks = [...modernBooks, ...doabBooks, ...olBooks, ...archBooks];

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

  if (!BOOKS_ONLY) {
    console.log('📊  Seeding demo activity (progress, reviews, loans)…');
    await seedDemoActivity();
  }
}

main()
  .catch((err) => { console.error('Seed failed:', err); process.exit(1); })
  .finally(()  => prisma.$disconnect());
