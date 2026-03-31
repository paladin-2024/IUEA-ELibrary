const axios = require('axios');

const ARCHIVE_API = 'https://archive.org';

const searchArchive = async ({ query, mediatype = 'texts', limit = 20, page = 1 }) => {
  const response = await axios.get(`${ARCHIVE_API}/advancedsearch.php`, {
    params: {
      q:       `${query} AND mediatype:${mediatype}`,
      fl:      'identifier,title,creator,description,subject,date,language',
      rows:    limit,
      page,
      output:  'json',
    },
  });
  return response.data.response.docs;
};

const getArchiveItem = async (identifier) => {
  const [meta, files] = await Promise.all([
    axios.get(`${ARCHIVE_API}/metadata/${identifier}`),
    axios.get(`${ARCHIVE_API}/metadata/${identifier}/files`),
  ]);

  const fileList = files.data.result || [];
  const pdfFile  = fileList.find((f) => f.name?.endsWith('.pdf'));
  const epubFile = fileList.find((f) => f.name?.endsWith('.epub'));
  const preferred = epubFile || pdfFile;

  return {
    ...meta.data.metadata,
    fileUrl:  preferred ? `https://archive.org/download/${identifier}/${preferred.name}` : null,
    fileType: epubFile ? 'epub' : pdfFile ? 'pdf' : null,
  };
};

module.exports = { searchArchive, getArchiveItem };
