'use strict';

jest.mock('../config/prisma', () => require('./mocks/prisma.mock'));
jest.mock('../config/firebase', () => ({ initFirebase: jest.fn(), getMessaging: jest.fn() }));

// Mock global fetch used by the translation controller
global.fetch = jest.fn();

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../app');
const prisma  = require('../config/prisma');

const TOKEN     = jwt.sign({ id: 'user-1', role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const MOCK_USER = { id: 'user-1', name: 'Alice', email: 'alice@iuea.ac.ug', role: 'student', isActive: true };

beforeEach(() => {
  prisma.user.findUnique.mockResolvedValue(MOCK_USER);
});

afterEach(() => {
  fetch.mockReset();
});

function mockMyMemory(translatedText) {
  fetch.mockResolvedValue({
    ok:   true,
    json: async () => ({
      responseStatus: 200,
      responseData:   { translatedText },
    }),
  });
}

// ── POST /api/translate ───────────────────────────────────────────────────────
describe('POST /api/translate', () => {
  it('translates text from English to French', async () => {
    mockMyMemory('Bonjour le monde');

    const res = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ text: 'Hello world', targetLanguage: 'French', sourceLanguage: 'en' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('translatedText', 'Bonjour le monde');
    expect(res.body).toHaveProperty('targetLang', 'fr');
  });

  it('resolves full language names to BCP-47 codes', async () => {
    mockMyMemory('Habari ya dunia');

    const res = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ text: 'Hello world', targetLanguage: 'Swahili' });

    expect(res.status).toBe(200);
    expect(res.body.targetLang).toBe('sw');
  });

  it('returns original text unchanged when source and target are the same', async () => {
    const res = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ text: 'Hello', targetLanguage: 'en', sourceLanguage: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.translatedText).toBe('Hello');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 400 when text is missing', async () => {
    const res = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ targetLanguage: 'French' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('returns 400 when targetLanguage is missing', async () => {
    const res = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ text: 'Hello world' });

    expect(res.status).toBe(400);
  });

  it('handles MyMemory API error gracefully', async () => {
    fetch.mockResolvedValue({
      ok:   false,
      json: async () => ({}),
    });

    const res = await request(app)
      .post('/api/translate')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ text: 'Hello', targetLanguage: 'Swahili' });

    expect(res.status).toBe(500);
  });
});
