const BorrowRequest = require('../models/BorrowRequest');

const markOverdueLoans = async () => {
  const result = await BorrowRequest.updateMany(
    { status: 'active', dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } },
  );
  return result.modifiedCount;
};

module.exports = { markOverdueLoans };
