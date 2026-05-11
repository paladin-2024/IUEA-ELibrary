'use strict';

// Shared Prisma mock — all methods are jest.fn() that can be configured per-test.
// Every test file that does jest.mock('../config/prisma', () => require('./mocks/prisma.mock'))
// gets the same mock object with fresh spies each test via beforeEach resets.

function modelMock() {
  return {
    findUnique:  jest.fn(),
    findFirst:   jest.fn(),
    findMany:    jest.fn(),
    create:      jest.fn(),
    update:      jest.fn(),
    updateMany:  jest.fn().mockResolvedValue({ count: 0 }),
    upsert:      jest.fn(),
    delete:      jest.fn(),
    deleteMany:  jest.fn().mockResolvedValue({ count: 0 }),
    count:       jest.fn().mockResolvedValue(0),
    aggregate:   jest.fn().mockResolvedValue({ _sum: {}, _count: {}, _avg: {}, _min: {}, _max: {} }),
  };
}

const prismaMock = {
  $connect:          jest.fn().mockResolvedValue(undefined),
  $disconnect:       jest.fn().mockResolvedValue(undefined),
  $queryRaw:         jest.fn().mockResolvedValue([]),
  $executeRaw:       jest.fn().mockResolvedValue(0),
  user:              modelMock(),
  book:              modelMock(),
  userProgress:      modelMock(),
  chatSession:       modelMock(),
  podcast:           modelMock(),
  audioCache:        modelMock(),
  collection:        modelMock(),
  borrowRequest:     modelMock(),
  review:            { ...modelMock(), groupBy: jest.fn().mockResolvedValue([]) },
};

// Auto-reset all mocks between tests so state doesn't leak
afterEach(() => {
  for (const model of Object.values(prismaMock)) {
    if (model && typeof model === 'object') {
      for (const fn of Object.values(model)) {
        if (typeof fn?.mockReset === 'function') fn.mockReset();
      }
    }
  }
  // Restore defaults
  for (const model of Object.values(prismaMock)) {
    if (model?.count)      model.count.mockResolvedValue(0);
    if (model?.updateMany) model.updateMany.mockResolvedValue({ count: 0 });
    if (model?.deleteMany) model.deleteMany.mockResolvedValue({ count: 0 });
    if (model?.aggregate)  model.aggregate.mockResolvedValue({ _sum: {}, _count: {}, _avg: {}, _min: {}, _max: {} });
    if (model?.groupBy)    model.groupBy.mockResolvedValue([]);
  }
  prismaMock.$queryRaw.mockResolvedValue([]);
  prismaMock.$executeRaw.mockResolvedValue(0);
});

module.exports = prismaMock;
