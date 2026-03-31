const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const r2Client = require('../config/r2');
const path     = require('path');
const fs       = require('fs');

const BUCKET = process.env.R2_BUCKET_NAME;

// R2 is considered configured when all three env vars are present.
const isR2Configured = () =>
  !!(BUCKET && process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY);

// ── Dev fallback ──────────────────────────────────────────────────────────────
// TODO: switch to R2 in production — remove this block and the isR2Configured
//       guard once R2 credentials are set in the environment.
const saveLocally = async (buffer, key) => {
  const dest = path.join(__dirname, '../../public/uploads', key);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buffer);
  const base = process.env.SERVER_URL || 'http://localhost:5000';
  return `${base}/uploads/${key}`;
};

// ── Core upload ───────────────────────────────────────────────────────────────
// Key patterns:
//   books/{bookId}.epub  |  books/{bookId}.pdf
//   covers/{bookId}.jpg
//
// Returns the public URL of the uploaded file.
const uploadFile = async (buffer, key, contentType) => {
  if (!isR2Configured()) {
    return saveLocally(buffer, key);
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        buffer,
      ContentType: contentType,
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
};

// ── uploadBookFile ────────────────────────────────────────────────────────────
// Takes a multer file object (has .buffer, .originalname, .mimetype).
// Key: books/{bookId}.{ext}
const uploadBookFile = async (file, bookId) => {
  const ext = (file.originalname.split('.').pop() || 'epub').toLowerCase();
  const key = `books/${bookId}.${ext}`;
  return uploadFile(file.buffer, key, file.mimetype);
};

// ── uploadCover ───────────────────────────────────────────────────────────────
// Takes a raw Buffer (JPEG).
// Key: covers/{bookId}.jpg
const uploadCover = async (buffer, bookId) => {
  const key = `covers/${bookId}.jpg`;
  return uploadFile(buffer, key, 'image/jpeg');
};

// ── deleteFile ────────────────────────────────────────────────────────────────
const deleteFile = async (key) => {
  if (!isR2Configured()) {
    // Remove from local uploads in dev
    const dest = path.join(__dirname, '../../public/uploads', key);
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    return;
  }

  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

module.exports = { uploadFile, uploadBookFile, uploadCover, deleteFile };
