const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role:      { type: String, enum: ['user', 'assistant'], required: true },
    content:   { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    language:  { type: String },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
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
    messages: {
      type:    [messageSchema],
      default: [],
    },
    language: {
      type:    String,
      default: 'English',
    },
    model: {
      type:    String,
      default: 'gemini-1.5-flash',
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
chatSessionSchema.index({ userId: 1, bookId: 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
