const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    rating:      { type: Number, required: true, min: 1, max: 5 },
    text:        { type: String, maxlength: 2000 },
    isVerified:  { type: Boolean, default: false }, // read >30% of book
    helpfulVotes: { type: [String], default: [] },  // userIds
  },
  { timestamps: true }
);

reviewSchema.index({ bookId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
