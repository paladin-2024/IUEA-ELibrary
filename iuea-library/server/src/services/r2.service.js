const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const r2Client          = require('../config/r2');
const crypto            = require('crypto');

const BUCKET = process.env.R2_BUCKET_NAME;

const uploadFile = async ({ buffer, mimeType, folder = 'books', extension = 'pdf' }) => {
  const key = `${folder}/${crypto.randomUUID()}.${extension}`;
  await r2Client.send(
    new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        buffer,
      ContentType: mimeType,
    })
  );
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
  return { key, publicUrl };
};

const getSignedDownloadUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2Client, command, { expiresIn });
};

const deleteFile = async (key) => {
  await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

module.exports = { uploadFile, getSignedDownloadUrl, deleteFile };
