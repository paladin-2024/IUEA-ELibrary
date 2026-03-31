const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String },
    audioUrl:    { type: String, required: true },
    duration:    { type: Number },           // seconds
    publishDate: { type: Date },
    season:      { type: Number },
    episode:     { type: Number },
  },
  { _id: true, timestamps: false }
);

const podcastSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: true,
    },
    description: {
      type: String,
    },
    hostName: {
      type: String,
    },
    coverUrl: {
      type: String,
    },
    rssUrl: {
      type:     String,
      unique:   true,
      required: true,
    },
    category: {
      type: String,
      enum: ['Education', 'Science', 'Literature', 'Law', 'Technology', 'Culture'],
    },
    language: {
      type:    String,
      default: 'English',
    },
    subscriberCount: {
      type:    Number,
      default: 0,
    },
    episodes: {
      type:    [episodeSchema],
      default: [],
    },
    lastFetched: {
      type: Date,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Podcast', podcastSchema);
