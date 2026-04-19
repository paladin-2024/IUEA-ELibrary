const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    bookTitle:     { type: String, required: true },
    bookAuthor:    { type: String },
    bookCoverUrl:  { type: String },
    shelfLocation: { type: String },
    status: {
      type:    String,
      enum:    ['pending', 'approved', 'rejected', 'active', 'overdue', 'returned'],
      default: 'pending',
    },
    approvedAt:       { type: Date },
    dueDate:          { type: Date },
    returnedAt:       { type: Date },
    adminNotes:       { type: String },
    renewalRequested: { type: Boolean, default: false },
    renewalCount:     { type: Number,  default: 0 },
  },
  { timestamps: true }
);

borrowRequestSchema.index({ userId: 1, status: 1 });
borrowRequestSchema.index({ bookId: 1 });
borrowRequestSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);
