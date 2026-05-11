'use strict';

const { PrismaClient } = require('@prisma/client');

// Reuse a single instance to avoid exhausting the connection pool
const prisma = global.__prisma ?? new PrismaClient();
global.__prisma = prisma;

module.exports = prisma;
