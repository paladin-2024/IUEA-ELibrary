'use strict';

const { z } = require('zod');

const chat = z.object({
  message:  z.string().trim().min(1, 'message is required.'),
  language: z.string().trim().optional().default('English'),
  chapter:  z.string().trim().optional().default(''),
});

module.exports = { chat };
