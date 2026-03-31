const axios = require('axios');

const ARCHIVE_SEARCH = 'https://archive.org/advancedsearch.php';
const ARCHIVE_META   = 'https://archive.org/metadata';
const GUTENBERG_API  = 'https://gutendex.com/books';

// ── Internet Archive ──────────────────────────────────────────────────────────

async function searchArchive(query) {
  const { data } = await axios.get(ARCHIVE_SEARCH, {
    params: {
      q:         `${query} subject:academic`,
      'fl[]':    ['identifier', 'title', 'creator', 'subject'],
      rows:      8,
      output:    'json',
      mediatype: 'texts',
    },
    timeout: 8000,
  });

  const docs = data?.response?.docs ?? [];
  return docs.map((d) => ({
    source:     'archive',
    archiveId:  d.identifier,
    title:      Array.isArray(d.title)   ? d.title[0]   : (d.title   ?? 'Unknown Title'),
    author:     Array.isArray(d.creator) ? d.creator[0] : (d.creator ?? 'Unknown'),
    category:   Array.isArray(d.subject) ? d.subject[0] : (d.subject ?? 'General'),
    coverUrl:   `https://archive.org/services/img/${d.identifier}`,
    fileFormat: 'external',
    isExternal: true,
  }));
}

async function getArchiveBookUrl(identifier) {
  const { data } = await axios.get(`${ARCHIVE_META}/${identifier}`, { timeout: 8000 });
  const files    = data?.files ?? [];
  const epub     = files.find((f) => f.name?.toLowerCase().endsWith('.epub'));
  const pdf      = files.find((f) => f.name?.toLowerCase().endsWith('.pdf'));
  const file     = epub ?? pdf;
  if (!file) return null;
  return `https://archive.org/download/${identifier}/${file.name}`;
}

// ── Project Gutenberg ─────────────────────────────────────────────────────────

async function searchGutenberg(query) {
  const { data } = await axios.get(GUTENBERG_API, {
    params:  { search: query },
    timeout: 8000,
  });

  const results = data?.results ?? [];
  return results.slice(0, 8).map((b) => {
    const epubUrl = b.formats?.['application/epub+zip'] ?? null;
    return {
      source:      'gutenberg',
      gutenbergId: b.id,
      title:       b.title ?? 'Unknown Title',
      author:      b.authors?.[0]?.name ?? 'Unknown',
      category:    b.subjects?.[0] ?? 'General',
      coverUrl:    b.formats?.['image/jpeg'] ?? null,
      fileUrl:     epubUrl,
      fileFormat:  epubUrl ? 'epub' : null,
      isExternal:  true,
    };
  });
}

module.exports = { searchArchive, getArchiveBookUrl, searchGutenberg };
