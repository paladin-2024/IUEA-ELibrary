'use strict';

const BOOK    = { id: 'book1', title: 'Intro to CS', author: 'Jane Doe', faculty: ['ICT'] };
const GENERAL = { id: '__general__', title: 'IUEA Library', author: 'IUEA', faculty: [] };

// Load fresh copies of the service + mock after each resetModules so the
// singleton's private _model variable is null and the mock instances align.
function freshLoad() {
  jest.resetModules();
  jest.mock('@google/generative-ai');
  const svc    = require('../../services/gemini.service');
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  return { svc, GoogleGenerativeAI };
}

describe('gemini.service', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('missing API key', () => {
    it('getChatResponse throws readable error', async () => {
      const { svc } = freshLoad();
      await expect(
        svc.getChatResponse([{ role: 'user', content: 'Hello' }], BOOK, '', 'English')
      ).rejects.toThrow('AI Assistant is not configured yet');
    });

    it('getChatStream throws readable error', async () => {
      const { svc } = freshLoad();
      await expect(
        svc.getChatStream([{ role: 'user', content: 'Hello' }], BOOK, '', 'English')
      ).rejects.toThrow('AI Assistant is not configured yet');
    });
  });

  describe('with valid API key', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-key-abc';
    });

    it('getChatResponse returns reply text', async () => {
      const { svc, GoogleGenerativeAI } = freshLoad();

      const sendMessage       = jest.fn().mockResolvedValue({ response: { text: () => 'Hello, I can help!' } });
      const startChat         = jest.fn().mockReturnValue({ sendMessage });
      const getGenerativeModel = jest.fn().mockReturnValue({ startChat });
      GoogleGenerativeAI.mockImplementation(() => ({ getGenerativeModel }));

      const reply = await svc.getChatResponse(
        [{ role: 'user', content: 'What is recursion?' }],
        BOOK, 'Chapter 1', 'English'
      );

      expect(reply).toBe('Hello, I can help!');
      expect(startChat).toHaveBeenCalledWith(
        expect.objectContaining({ systemInstruction: expect.stringContaining('Intro to CS') })
      );
    });

    it('uses general system prompt for __general__ book', async () => {
      const { svc, GoogleGenerativeAI } = freshLoad();

      const sendMessage       = jest.fn().mockResolvedValue({ response: { text: () => 'I am IUEA Library AI.' } });
      const startChat         = jest.fn().mockReturnValue({ sendMessage });
      const getGenerativeModel = jest.fn().mockReturnValue({ startChat });
      GoogleGenerativeAI.mockImplementation(() => ({ getGenerativeModel }));

      await svc.getChatResponse([{ role: 'user', content: 'What can you do?' }], GENERAL, '', 'English');

      const { systemInstruction } = startChat.mock.calls[0][0];
      expect(systemInstruction).toContain('IUEA Library AI Assistant at');
      expect(systemInstruction).not.toContain('Book:');
    });

    it('history excludes the last message; last message sent separately', async () => {
      const { svc, GoogleGenerativeAI } = freshLoad();

      const sendMessage       = jest.fn().mockResolvedValue({ response: { text: () => 'Got it.' } });
      const startChat         = jest.fn().mockReturnValue({ sendMessage });
      const getGenerativeModel = jest.fn().mockReturnValue({ startChat });
      GoogleGenerativeAI.mockImplementation(() => ({ getGenerativeModel }));

      const messages = [
        { role: 'user',      content: 'First message' },
        { role: 'assistant', content: 'First reply' },
        { role: 'user',      content: 'Second message' },
      ];
      await svc.getChatResponse(messages, BOOK, '', 'English');

      const historyArg = startChat.mock.calls[0][0].history;
      expect(historyArg).toHaveLength(2);
      expect(historyArg[1].role).toBe('model'); // 'assistant' mapped to 'model'
      expect(sendMessage).toHaveBeenCalledWith('Second message');
    });

    it('getChatStream returns async iterable chunks', async () => {
      const { svc, GoogleGenerativeAI } = freshLoad();

      async function* fakeStream() {
        yield { text: () => 'Hello' };
        yield { text: () => ' world' };
      }
      const sendMessageStream  = jest.fn().mockResolvedValue({ stream: fakeStream() });
      const startChat          = jest.fn().mockReturnValue({ sendMessageStream });
      const getGenerativeModel = jest.fn().mockReturnValue({ startChat });
      GoogleGenerativeAI.mockImplementation(() => ({ getGenerativeModel }));

      const stream = await svc.getChatStream(
        [{ role: 'user', content: 'Hi' }], BOOK, '', 'English'
      );

      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk.text());
      expect(chunks).toEqual(['Hello', ' world']);
    });

    it('system prompt includes requested language', async () => {
      const { svc, GoogleGenerativeAI } = freshLoad();

      const sendMessage       = jest.fn().mockResolvedValue({ response: { text: () => 'Bonjour' } });
      const startChat         = jest.fn().mockReturnValue({ sendMessage });
      const getGenerativeModel = jest.fn().mockReturnValue({ startChat });
      GoogleGenerativeAI.mockImplementation(() => ({ getGenerativeModel }));

      await svc.getChatResponse([{ role: 'user', content: 'Bonjour' }], BOOK, '', 'French');

      expect(startChat.mock.calls[0][0].systemInstruction).toContain('French');
    });

    it('model singleton: GoogleGenerativeAI constructed only once across calls', async () => {
      const { svc, GoogleGenerativeAI } = freshLoad();

      const sendMessage       = jest.fn().mockResolvedValue({ response: { text: () => 'ok' } });
      const startChat         = jest.fn().mockReturnValue({ sendMessage });
      const getGenerativeModel = jest.fn().mockReturnValue({ startChat });
      GoogleGenerativeAI.mockImplementation(() => ({ getGenerativeModel }));

      await svc.getChatResponse([{ role: 'user', content: 'a' }], BOOK, '', 'English');
      await svc.getChatResponse([{ role: 'user', content: 'b' }], BOOK, '', 'English');

      expect(GoogleGenerativeAI).toHaveBeenCalledTimes(1);
    });
  });
});
