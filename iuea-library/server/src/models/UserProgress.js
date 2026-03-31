const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema(
  {
    page:      { type: Number },
    cfi:       { type: String },         // EPUB CFI for exact location
    text:      { type: String },
    color:     { type: String, default: 'yellow' },
    note:      { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    bookId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Book',
      required: true,
    },
    currentPage: {
      type:    Number,
      default: 0,
    },
    // EPUB CFI location string — used by both react-reader (web) and
    // flutter_epub_viewer (mobile) to restore exact reading position.
    currentCfi: {
      type: String,
    },
    percentComplete: {
      type:    Number,
      default: 0,
      min:     0,
      max:     100,
    },
    currentChapter: {
      type:    Number,
      default: 0,
    },
    bookmarks: {
      type:    [Number],
      default: [],
    },
    highlights: {
      type:    [highlightSchema],
      default: [],
    },
    readingLanguage: {
      type:    String,
      default: 'English',
    },
    totalReadingMinutes: {
      type:    Number,
      default: 0,
    },
    isCompleted: {
      type:    Boolean,
      default: false,
    },
    lastReadAt: {
      type: Date,
    },
    lastDevice: {
      type:    String,
      enum:    ['mobile', 'web'],
      default: 'web',
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
userProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);
