'use strict';

jest.mock('../config/prisma',  () => require('./mocks/prisma.mock'));
jest.mock('../config/firebase', () => ({ initFirebase: jest.fn(), getMessaging: jest.fn() }));
jest.mock('../services/podcast.service', () => ({
  syncPodcast:    jest.fn().mockResolvedValue(undefined),
  seedPodcasts:   jest.fn().mockResolvedValue(undefined),
  startCronSync:  jest.fn(),
  syncAllFeeds:   jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../app');
const prisma  = require('../config/prisma');

const TOKEN     = jwt.sign({ id: 'user-1', role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const MOCK_USER = { id: 'user-1', name: 'Alice', email: 'alice@iuea.ac.ug', role: 'student', isActive: true };

const PODCASTS = [
  { id: 'p1', title: 'Law Today',       category: 'Law',      hostName: 'Atim Akello',
    coverUrl: null, episodes: [], subscriberCount: 5, isActive: true },
  { id: 'p2', title: 'Science Weekly',  category: 'Science',  hostName: 'Dr. Ouma',
    coverUrl: null, episodes: [], subscriberCount: 12, isActive: true },
];

beforeEach(() => {
  prisma.user.findUnique.mockResolvedValue(MOCK_USER);
});

// ── GET /api/podcasts ─────────────────────────────────────────────────────────
describe('GET /api/podcasts', () => {
  it('returns list of podcasts', async () => {
    prisma.podcast.findMany.mockResolvedValue(PODCASTS);
    prisma.podcast.count.mockResolvedValue(2);

    const res = await request(app)
      .get('/api/podcasts')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('podcasts');
    expect(res.body.podcasts).toHaveLength(2);
  });

  it('supports category filter', async () => {
    prisma.podcast.findMany.mockResolvedValue([PODCASTS[0]]);
    prisma.podcast.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/podcasts?category=Law')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.podcasts[0].category).toBe('Law');
  });
});

// ── GET /api/podcasts/:id ─────────────────────────────────────────────────────
describe('GET /api/podcasts/:id', () => {
  it('returns single podcast with episodes', async () => {
    prisma.podcast.findUnique.mockResolvedValue({
      ...PODCASTS[0],
      episodes: [{ title: 'Episode 1', audioUrl: 'http://x.mp3', duration: 1200 }],
    });
    prisma.podcastSubscriber.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/podcasts/p1')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('podcast');
    expect(res.body.podcast.id).toBe('p1');
  });

  it('returns 404 for unknown podcast', async () => {
    prisma.podcast.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/podcasts/does-not-exist')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/podcasts/subscribe/:id ─────────────────────────────────────────
describe('POST /api/podcasts/subscribe/:id', () => {
  it('subscribes the user to a podcast', async () => {
    prisma.podcast.findUnique.mockResolvedValue(PODCASTS[0]);
    prisma.podcastSubscriber.upsert.mockResolvedValue({ userId: 'user-1', podcastId: 'p1' });
    prisma.podcast.update.mockResolvedValue({ ...PODCASTS[0], subscriberCount: 6 });

    const res = await request(app)
      .post('/api/podcasts/subscribe/p1')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('subscribed', true);
    expect(res.body).toHaveProperty('subscriberCount');
  });

  it('returns 404 when podcast not found', async () => {
    prisma.podcast.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/podcasts/subscribe/ghost')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/podcasts/subscribe/:id ───────────────────────────────────────
describe('DELETE /api/podcasts/subscribe/:id', () => {
  it('unsubscribes the user', async () => {
    prisma.podcastSubscriber.deleteMany.mockResolvedValue({ count: 1 });
    prisma.podcastSubscriber.count.mockResolvedValue(4);
    prisma.podcast.update.mockResolvedValue({ ...PODCASTS[0], subscriberCount: 4 });

    const res = await request(app)
      .delete('/api/podcasts/subscribe/p1')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('subscribed', false);
    expect(res.body).toHaveProperty('subscriberCount', 4);
  });
});

// ── GET /api/podcasts/subscriptions ──────────────────────────────────────────
describe('GET /api/podcasts/subscriptions', () => {
  it('returns user podcast subscriptions', async () => {
    prisma.podcastSubscriber.findMany.mockResolvedValue([
      { podcast: PODCASTS[0] },
    ]);

    const res = await request(app)
      .get('/api/podcasts/subscriptions')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('podcasts');
  });
});
