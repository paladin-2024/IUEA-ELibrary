'use strict';

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-msg-id' });

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

const { sendWelcomeEmail, sendPasswordReset, sendWeeklyDigest } = require('../../services/email.service');

const USER = { name: 'Alice Nakato', email: 'alice@iuea.ac.ug' };

afterEach(() => mockSendMail.mockClear());

// ── sendWelcomeEmail ──────────────────────────────────────────────────────────
describe('email.service — sendWelcomeEmail', () => {
  it('sends an email to the new user', async () => {
    await sendWelcomeEmail(USER);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe('alice@iuea.ac.ug');
    expect(call.subject).toMatch(/welcome/i);
    expect(call.html).toContain('Alice Nakato');
  });

  it('includes a "Start Reading" CTA link in the HTML', async () => {
    await sendWelcomeEmail(USER);
    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain('Start Reading');
  });
});

// ── sendPasswordReset ─────────────────────────────────────────────────────────
describe('email.service — sendPasswordReset', () => {
  it('sends reset email with the token embedded in the link', async () => {
    await sendPasswordReset(USER, 'reset-token-abc123');

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe('alice@iuea.ac.ug');
    expect(call.subject).toMatch(/password/i);
    expect(call.html).toContain('reset-token-abc123');
  });

  it('constructs link from CLIENT_WEB_URL env var', async () => {
    process.env.CLIENT_WEB_URL = 'https://library.iuea.ac.ug';
    await sendPasswordReset(USER, 'mytoken');

    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain('https://library.iuea.ac.ug/reset-password?token=mytoken');
  });
});

// ── sendWeeklyDigest ──────────────────────────────────────────────────────────
describe('email.service — sendWeeklyDigest', () => {
  it('sends digest email with stats summary', async () => {
    const stats = { booksRead: 3, minutesRead: 185, sessions: 7, topBook: 'Engineering Fundamentals' };
    await sendWeeklyDigest(USER, stats);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe('alice@iuea.ac.ug');
    expect(call.html).toContain('3');
    expect(call.html).toContain('Engineering Fundamentals');
  });

  it('formats reading time as hours + minutes when >= 60 minutes', async () => {
    await sendWeeklyDigest(USER, { minutesRead: 90, booksRead: 1, sessions: 3 });

    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain('1h 30m');
  });

  it('formats reading time as minutes only when < 60 minutes', async () => {
    await sendWeeklyDigest(USER, { minutesRead: 45, booksRead: 0, sessions: 2 });

    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain('45m');
    expect(html).not.toContain('0h');
  });

  it('handles empty stats gracefully (no throw)', async () => {
    await expect(sendWeeklyDigest(USER, {})).resolves.not.toThrow();
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });
});
