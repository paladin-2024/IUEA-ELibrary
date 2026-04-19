'use strict';

// Mock AWS SDK before requiring r2.service
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client:          jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  PutObjectCommand:  jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));
jest.mock('../../config/r2', () => ({ send: jest.fn() }));

// Ensure R2 env vars are absent so dev-fallback path is exercised
delete process.env.R2_BUCKET_NAME;
delete process.env.R2_ACCOUNT_ID;
delete process.env.R2_ACCESS_KEY;

const path = require('path');
const fs   = require('fs');
const { uploadFile, uploadBookFile, uploadCover, deleteFile } = require('../../services/r2.service');

const TMP_UPLOADS = path.join(__dirname, '../../../public/uploads');

afterEach(() => {
  // Clean up any files written to dev fallback directory
  if (fs.existsSync(TMP_UPLOADS)) {
    fs.rmSync(TMP_UPLOADS, { recursive: true, force: true });
  }
});

// ── Dev fallback (R2 not configured) ─────────────────────────────────────────
describe('r2.service — dev fallback (no R2 credentials)', () => {
  it('uploadFile writes buffer to local path and returns localhost URL', async () => {
    const buf = Buffer.from('epub content here');
    const url = await uploadFile(buf, 'books/test.epub', 'application/epub+zip');

    expect(url).toMatch(/http:\/\/localhost.*uploads\/books\/test\.epub/);
    const dest = path.join(TMP_UPLOADS, 'books/test.epub');
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest).toString()).toBe('epub content here');
  });

  it('uploadBookFile derives key from originalname extension', async () => {
    const file = { buffer: Buffer.from('PDF'), originalname: 'textbook.pdf', mimetype: 'application/pdf' };
    const url  = await uploadBookFile(file, 'book-999');

    expect(url).toMatch(/books\/book-999\.pdf/);
  });

  it('uploadCover writes JPEG with covers/ prefix', async () => {
    const buf = Buffer.from('JPEG data');
    const url = await uploadCover(buf, 'book-888');

    expect(url).toMatch(/covers\/book-888\.jpg/);
    const dest = path.join(TMP_UPLOADS, 'covers/book-888.jpg');
    expect(fs.existsSync(dest)).toBe(true);
  });

  it('deleteFile removes local file silently when it exists', async () => {
    // Create the file first
    const dest = path.join(TMP_UPLOADS, 'books/del-me.epub');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, 'data');

    await deleteFile('books/del-me.epub');
    expect(fs.existsSync(dest)).toBe(false);
  });

  it('deleteFile does not throw when file does not exist', async () => {
    await expect(deleteFile('books/nonexistent.epub')).resolves.toBeUndefined();
  });
});
