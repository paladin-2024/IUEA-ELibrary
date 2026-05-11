'use strict';

const { z } = require('zod');

const saveProgress = z.object({
  currentPage:     z.number().int().min(0).optional(),
  currentCfi:      z.string().optional(),
  percentComplete: z.number().min(0).max(100).optional(),
  currentChapter:  z.string().optional(),
  readingLanguage: z.string().optional(),
  highlights:      z.array(z.record(z.unknown())).optional(),
  bookmarks:       z.array(z.record(z.unknown())).optional(),
  device:          z.string().optional(),
  minutesRead:     z.number().min(0).optional(),
});

module.exports = { saveProgress };
