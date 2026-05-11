'use strict';

jest.mock('../config/prisma', () => require('./mocks/prisma.mock'));

const prisma             = require('../config/prisma');
const { markOverdueLoans } = require('../jobs/overdue.job');

beforeEach(() => jest.clearAllMocks());

describe('markOverdueLoans', () => {
  it('updates active loans past dueDate to overdue', async () => {
    prisma.borrowRequest.updateMany.mockResolvedValue({ count: 3 });

    const result = await markOverdueLoans();

    expect(prisma.borrowRequest.updateMany).toHaveBeenCalledTimes(1);
    const [args] = prisma.borrowRequest.updateMany.mock.calls;
    expect(args[0].where.status).toBe('active');
    expect(args[0].where.dueDate).toHaveProperty('lt');
    expect(args[0].data).toHaveProperty('status', 'overdue');
    expect(result).toBe(3);
  });

  it('returns 0 when no loans are overdue', async () => {
    prisma.borrowRequest.updateMany.mockResolvedValue({ count: 0 });

    const result = await markOverdueLoans();

    expect(result).toBe(0);
  });

  it('throws if the DB call fails', async () => {
    prisma.borrowRequest.updateMany.mockRejectedValue(new Error('DB error'));

    await expect(markOverdueLoans()).rejects.toThrow('DB error');
  });
});
