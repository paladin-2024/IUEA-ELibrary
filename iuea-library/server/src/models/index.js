/**
 * Model exports for the IUEA Library server.
 *
 * This project uses Neon PostgreSQL via a custom Prisma-shaped client
 * (src/config/prisma.js). Controllers import that client directly.
 *
 * This file exports named uppercase aliases so service files can write
 *   const { Book } = require('../models')
 * and get the correct model object.
 *
 * Full Mongoose schema definitions live alongside each model file
 * (User.js, Book.js, …) as authoritative field documentation.
 * They are NOT connected to MongoDB — mongoose is not installed.
 * If you want to switch to MongoDB later, add mongoose to package.json
 * and call mongoose.connect() in server.js.
 */
const prisma = require('../config/prisma');

module.exports = {
  // Named aliases (PascalCase) for service-layer imports
  User:             prisma.user,
  Book:             prisma.book,
  UserProgress:     prisma.userProgress,
  ChatSession:      prisma.chatSession,
  Podcast:          prisma.podcast,
  AudioCache:       prisma.audioCache,
  Collection:       prisma.collection,
  BorrowRequest:    prisma.borrowRequest,
  Review:           prisma.review,

  // Also export the full prisma client as default
  ...prisma,
};
