'use strict';

// PostgreSQL connection is managed by Prisma Client.
// This file is kept for compatibility with scripts that call connectDB().
const connectDB = async () => {
  const prisma = require('./prisma');
  await prisma.$connect();
  console.log('PostgreSQL connected via Prisma');
};

module.exports = connectDB;
