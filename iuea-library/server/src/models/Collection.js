const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    name: {
      type:     String,
      required: true,
      trim:     true,
    },
    description: {
      type:    String,
      default: '',
    },
    bookIds: {
      type:    [mongoose.Schema.Types.ObjectId],
      ref:     'Book',
      default: [],
    },
    isPublic: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

collectionSchema.index({ userId: 1 });
collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Collection', collectionSchema);
