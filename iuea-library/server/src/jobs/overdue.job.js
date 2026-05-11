'use strict';

const prisma = require('../config/prisma');

const markOverdueLoans = async () => {
  const result = await prisma.borrowRequest.updateMany({
    where: { status: 'active', dueDate: { lt: new Date() } },
    data:  { status: 'overdue' },
  });
  return result.count;
};

module.exports = { markOverdueLoans };
