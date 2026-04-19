const axios = require('axios');

const OL_SEARCH  = 'https://openlibrary.org/search.json';
const OL_COVER   = 'https://covers.openlibrary.org/b/id';

/**
 * Search Open Library for books matching the query.
 * Returns up to `limit` results shaped like our Book model.
 */
async function searchOpenLibrary(query, { limit = 20 } = {}) {
  const { data } = await axios.get(OL_SEARCH, {
    params: {
      q:      query,
      limit,
      fields: 'key,title,author_name,cover_i,subject,first_publish_year,isbn',
    },
    timeout: 8000,
  });

  const docs = data?.docs ?? [];
  return docs.map((d) => {
    const author   = Array.isArray(d.author_name) ? d.author_name[0] : (d.author_name ?? 'Unknown');
    const subject  = Array.isArray(d.subject)     ? d.subject[0]     : (d.subject     ?? 'General');
    const coverUrl = d.cover_i ? `${OL_COVER}/${d.cover_i}-M.jpg` : null;
    const isbn     = Array.isArray(d.isbn) ? d.isbn[0] : (d.isbn ?? null);

    return {
      source:         'openlibrary',
      openLibraryKey: d.key,
      title:          d.title    ?? 'Unknown Title',
      author,
      category:       subject,
      coverUrl,
      isbn,
      publishedYear:  d.first_publish_year ?? null,
      fileFormat:     'external',
      isExternal:     true,
    };
  });
}

module.exports = { searchOpenLibrary };
