'use strict';

jest.mock('../models/BorrowRequest', () => ({
  updateMany: jest.fn(),
}));

const BorrowRequest  = require('../models/BorrowRequest');
const { markOverdueLoans } = require('../jobs/overdue.job');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('markOverdueLoans', () => {
  it('updates active loans past dueDate to overdue', async () => {
    BorrowRequest.updateMany.mockResolvedValue({ modifiedCount: 3 });

    const result = await markOverdueLoans();

    expect(BorrowRequest.updateMany).toHaveBeenCalledTimes(1);
    const [filter, update] = BorrowRequest.updateMany.mock.calls[0];
    expect(filter.status).toBe('active');
    expect(filter.dueDate).toHaveProperty('$lt');
    expect(update.$set).toHaveProperty('status', 'overdue');
    expect(result).toBe(3);
  });

  it('returns 0 when no loans are overdue', async () => {
    BorrowRequest.updateMany.mockResolvedValue({ modifiedCount: 0 });

    const result = await markOverdueLoans();

    expect(result).toBe(0);
  });

  it('throws if the DB call fails', async () => {
    BorrowRequest.updateMany.mockRejectedValue(new Error('DB error'));

    await expect(markOverdueLoans()).rejects.toThrow('DB error');
  });
});
