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
    upsert:      jest.fn(),
    delete:      jest.fn(),
    deleteMany:  jest.fn(),
    count:       jest.fn().mockResolvedValue(0),
  };
}

const prismaMock = {
  $connect:          jest.fn().mockResolvedValue(undefined),
  $disconnect:       jest.fn().mockResolvedValue(undefined),
  user:              modelMock(),
  book:              modelMock(),
  userProgress:      modelMock(),
  chatSession:       modelMock(),
  podcast:           modelMock(),
  podcastSubscriber: modelMock(),
  audioCache:        modelMock(),
  collection:        modelMock(),
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
  // Restore count default
  for (const model of Object.values(prismaMock)) {
    if (model?.count) model.count.mockResolvedValue(0);
  }
});

module.exports = prismaMock;
