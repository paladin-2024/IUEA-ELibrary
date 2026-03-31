const mongoose = require('mongoose');

const audioCacheSchema = new mongoose.Schema(
  {
    bookId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Book',
      required: true,
    },
    chapterIndex: {
      type:     Number,
      required: true,
    },
    language: {
      type:     String,
      required: true,
    },
    voiceLang: {
      type:     String,
      required: true,
    },
    audioUrl: {
      type:     String,
      required: true,
    },
    durationSeconds: {
      type: Number,
    },
    generatedAt: {
      type:    Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Compound unique — one cached audio per book+chapter+language+voice combo
audioCacheSchema.index(
  { bookId: 1, chapterIndex: 1, language: 1, voiceLang: 1 },
  { unique: true }
);

// TTL index — MongoDB auto-deletes documents once expiresAt is reached
audioCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AudioCache', audioCacheSchema);
