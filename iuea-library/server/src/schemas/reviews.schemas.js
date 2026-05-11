'use strict';

const { z } = require('zod');

const addReview = z.object({
  rating: z.number().int().min(1, 'Rating must be between 1 and 5.').max(5, 'Rating must be between 1 and 5.'),
  text:   z.string().trim().max(2000).optional(),
});

const voteHelpful = z.object({
  reviewId: z.string().min(1, 'reviewId is required.'),
});

module.exports = { addReview, voteHelpful };
