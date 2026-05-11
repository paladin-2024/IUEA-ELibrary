'use strict';

const { z } = require('zod');

// Comma-separated string OR array → always resolves to array
const strArray = z
  .union([z.array(z.string()), z.string()])
  .transform((v) =>
    Array.isArray(v)
      ? v.map((s) => s.trim()).filter(Boolean)
      : String(v).split(',').map((s) => s.trim()).filter(Boolean)
  )
  .optional()
  .default([]);

const uploadBook = z.object({
  title:         z.string({ error: 'title is required.' }).trim().min(1, 'title is required.'),
  author:        z.string({ error: 'author is required.' }).trim().min(1, 'author is required.'),
  description:   z.string().trim().optional().default(''),
  category:      z.string().trim().optional().default('General'),
  faculty:       strArray,
  tags:          strArray,
  languages:     strArray,
  publishedYear: z.coerce.number().int().min(1000).max(2100).optional().nullable(),
});

const updateBook = z.object({
  title:         z.string().trim().min(1).optional(),
  author:        z.string().trim().min(1).optional(),
  description:   z.string().trim().optional(),
  category:      z.string().trim().optional(),
  isActive:      z.boolean().optional(),
  faculty:       strArray,
  tags:          strArray,
  languages:     strArray,
  publishedYear: z.coerce.number().int().min(1000).max(2100).optional().nullable(),
  pageCount:     z.coerce.number().int().min(0).optional().nullable(),
  rating:        z.number().min(0).max(5).optional(),
  ratingCount:   z.coerce.number().int().min(0).optional(),
  coverUrl:      z.string().url().optional().nullable(),
  fileUrl:       z.string().url().optional().nullable(),
});

const updateUserRole = z.object({
  role: z.enum(['student', 'staff', 'admin'], {
    errorMap: () => ({ message: 'Invalid role. Must be student, staff, or admin.' }),
  }),
});

const sendPushNotification = z.object({
  title:      z.string().trim().min(1, 'title is required.'),
  body:       z.string().trim().min(1, 'body is required.'),
  targetRole: z.enum(['student', 'staff', 'admin']).optional(),
  data:       z.record(z.unknown()).optional().default({}),
});

const addPodcast = z.object({
  rssUrl:   z.string().url('rssUrl must be a valid URL.'),
  category: z.string().trim().optional().default('Education'),
  language: z.string().trim().optional().default('English'),
});

const updatePodcast = z.object({
  title:       z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  category:    z.string().trim().optional(),
  language:    z.string().trim().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'No fields to update.' });

module.exports = {
  uploadBook, updateBook, updateUserRole,
  sendPushNotification, addPodcast, updatePodcast,
};
