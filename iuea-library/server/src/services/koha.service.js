const axios  = require('axios');
const prisma = require('../config/prisma');

const KOHA_BASE_URL     = process.env.KOHA_BASE_URL;
const KOHA_CLIENT_ID    = process.env.KOHA_CLIENT_ID;
const KOHA_CLIENT_SECRET = process.env.KOHA_CLIENT_SECRET;

// ── Token cache ───────────────────────────────────────────────────────────────
let _token       = null;
let _tokenExpiry = null;

// ── getToken ──────────────────────────────────────────────────────────────────
const getToken = async () => {
  // Return cached token if still valid (with 60s safety buffer)
  if (_token && _tokenExpiry && Date.now() < _tokenExpiry - 60_000) {
    return _token;
  }

  try {
    // Attempt OAuth2 client_credentials flow
    const res = await axios.post(
      `${KOHA_BASE_URL}/api/v1/oauth/token`,
      new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     KOHA_CLIENT_ID,
        client_secret: KOHA_CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    _token       = res.data.access_token;
    // Koha returns expires_in in seconds; default 3600 (1h)
    const expiresIn = (res.data.expires_in || 3600) * 1000;
    _tokenExpiry = Date.now() + expiresIn;
    return _token;

  } catch {
    // OAuth failed — fall back to HTTP Basic Auth by returning null.
    // getHeaders() handles the Basic header when token is null.
    _token       = null;
    _tokenExpiry = null;
    return null;
  }
};

// ── getHeaders ────────────────────────────────────────────────────────────────
const getHeaders = async () => {
  const token = await getToken();
  if (token) {
    return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  }
  // Basic Auth fallback
  const encoded = Buffer.from(`${KOHA_CLIENT_ID}:${KOHA_CLIENT_SECRET}`).toString('base64');
  return { Authorization: `Basic ${encoded}`, Accept: 'application/json' };
};

// ── Koha API client ───────────────────────────────────────────────────────────
const kohaApi = axios.create({ baseURL: `${KOHA_BASE_URL}/api/v1` });

kohaApi.interceptors.request.use(async (config) => {
  config.headers = { ...config.headers, ...(await getHeaders()) };
  return config;
});

// ── Open Library cover helper ─────────────────────────────────────────────────
const fetchOpenLibraryCover = async (isbn, title) => {
  try {
    if (isbn) {
      // Quick check — just construct the URL; Open Library always returns
      // something (or a placeholder) for the -L size.
      return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    }
    if (title) {
      const encoded = encodeURIComponent(title);
      const res = await axios.get(
        `https://openlibrary.org/search.json?title=${encoded}&fields=cover_i&limit=1`,
        { timeout: 5000 }
      );
      const coverId = res.data?.docs?.[0]?.cover_i;
      if (coverId) return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    }
  } catch {
    // Non-critical — carry on without a cover
  }
  return null;
};

// ── Subject string → tags array ───────────────────────────────────────────────
const splitSubjects = (subject) => {
  if (!subject) return [];
  return subject
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

// ── normalizeBiblio ───────────────────────────────────────────────────────────
const normalizeBiblio = async (record) => {
  const isbn = record.isbn || record.isbn13 || null;

  const normalized = {
    kohaId:       String(record.biblio_id || record.biblionumber || ''),
    title:        record.title               || 'Untitled',
    author:       record.author              || 'Unknown',
    isbn:         isbn                       || undefined,
    publishedYear: record.copyrightdate
      ? Number(record.copyrightdate)
      : undefined,
    pageCount:    record.pages ? Number(record.pages) : undefined,
    tags:         splitSubjects(record.subject),
    description:  record.abstract || record.notes || undefined,
    category:     record.itemtype || record.ccode || 'General',
    languages:    record.language ? [record.language] : ['English'],
    lastSyncedFromKoha: new Date(),
  };

  normalized.coverUrl = await fetchOpenLibraryCover(isbn, record.title);

  return normalized;
};

// ── searchBooks ───────────────────────────────────────────────────────────────
const searchBooks = async (query, filters = {}) => {
  const res = await kohaApi.get('/biblios', {
    params: {
      q:          query,
      _per_page:  filters.limit || 20,
      _page:      filters.page  || 1,
    },
  });

  const records = Array.isArray(res.data) ? res.data : res.data?.results || [];
  return Promise.all(records.map(normalizeBiblio));
};

// ── getBookById ───────────────────────────────────────────────────────────────
const getBookById = async (kohaId) => {
  const res = await kohaApi.get(`/biblios/${kohaId}`);
  return normalizeBiblio(res.data);
};

// ── getBookItems ──────────────────────────────────────────────────────────────
const getBookItems = async (kohaId) => {
  const res   = await kohaApi.get(`/biblios/${kohaId}/items`);
  const items = Array.isArray(res.data) ? res.data : [];

  const total      = items.length;
  const checkedOut = items.filter((i) => i.onloan || i.checkout_id).length;
  const available  = total - checkedOut;

  return { total, available, checkedOut };
};

// ── findPatronByStudentId ─────────────────────────────────────────────────────
const findPatronByStudentId = async (studentId) => {
  const res = await kohaApi.get('/patrons', {
    params: { userid: studentId },
  });
  const results = Array.isArray(res.data) ? res.data : [];
  return results[0] || null;
};

// ── createPatron ──────────────────────────────────────────────────────────────
const createPatron = async (userData) => {
  const nameParts = (userData.name || '').trim().split(/\s+/);
  const firstname = nameParts.slice(0, -1).join(' ') || nameParts[0] || '';
  const surname   = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  const res = await kohaApi.post('/patrons', {
    userid:       userData.studentId,
    firstname,
    surname,
    email:        userData.email,
    branchcode:   'IUEA',
    categorycode: 'STUDENT',
  });

  return res.data;
};

// ── syncCatalogueToMongoDB ────────────────────────────────────────────────────
const syncCatalogueToMongoDB = async () => {
  let page    = 1;
  let hasMore = true;
  let count   = 0;

  while (hasMore) {
    let records;
    try {
      const res = await kohaApi.get('/biblios', {
        params: { _per_page: 100, _page: page },
      });
      records = Array.isArray(res.data) ? res.data : res.data?.results || [];
    } catch (err) {
      console.error(`[koha.service] Page ${page} fetch failed:`, err.message);
      break;
    }

    if (!records.length) {
      hasMore = false;
      break;
    }

    for (const record of records) {
      try {
        const normalized = await normalizeBiblio(record);
        if (!normalized.kohaId) continue;

        await prisma.book.upsert({
          where:  { kohaId: normalized.kohaId },
          update: normalized,
          create: { ...normalized, category: normalized.category || 'General' },
        });
        count++;
      } catch (err) {
        console.error(`[koha.service] Failed to upsert biblio:`, err.message);
      }
    }

    page++;
  }

  console.log(`[koha.service] Synced ${count} books from Koha`);
  return count;
};

module.exports = {
  searchBooks,
  getBookById,
  getBookItems,
  findPatronByStudentId,
  createPatron,
  syncCatalogueToMongoDB,
};
