const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    isbn: {
      type: String,
    },
    title: {
      type:     String,
      required: true,
      trim:     true,
    },
    author: {
      type:     String,
      required: true,
    },
    description: {
      type: String,
    },
    coverUrl: {
      type: String, // Open Library URL
    },
    fileUrl: {
      type: String, // R2 path — EPUB or PDF
    },
    archiveId: {
      type:   String,
      unique: true,
      sparse: true,
    },
    gutenbergId: {
      type:   Number,
      unique: true,
      sparse: true,
    },
    fileFormat: {
      type: String,
      enum: ['epub', 'pdf', 'html', 'external'],
    },
    category: {
      type:     String,
      required: true,
    },
    faculty: {
      type:    [String],
      default: [],
    },
    tags: {
      type:    [String],
      default: [],
    },
    languages: {
      type:    [String],
      default: ['English'],
    },
    publishedYear: {
      type: Number,
    },
    pageCount: {
      type: Number,
    },
    rating: {
      type:    Number,
      default: 0,
    },
    ratingCount: {
      type:    Number,
      default: 0,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ tags: 1 });
bookSchema.index({ category: 1 });

module.exports = mongoose.model('Book', bookSchema);
