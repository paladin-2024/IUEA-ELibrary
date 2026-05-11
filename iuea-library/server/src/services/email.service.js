'use strict';

const { Resend } = require('resend');

const resend  = new Resend(process.env.RESEND_API_KEY);
const FROM    = process.env.FROM_EMAIL || 'IUEA Library <onboarding@resend.dev>';
const WEB_URL = process.env.CLIENT_WEB_URL || 'http://localhost:5173';

// ── Brand HTML wrapper ────────────────────────────────────────────────────────
const wrapHtml = (bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin:0; padding:0; background:#f5f5f5; font-family:Arial,sans-serif; }
    .wrapper { max-width:600px; margin:0 auto; background:#ffffff; }
    .header  { background:#7B0D1E; padding:24px 32px; }
    .header h1 { margin:0; color:#ffffff; font-size:20px; font-weight:700; letter-spacing:0.5px; }
    .header p  { margin:4px 0 0; color:#C9A84C; font-size:12px; }
    .body    { padding:32px; color:#1A1A1A; font-size:15px; line-height:1.7; }
    .body h2 { color:#7B0D1E; margin-top:0; }
    .cta     { display:inline-block; margin:20px 0; padding:12px 28px;
               background:#7B0D1E; color:#ffffff; text-decoration:none;
               border-radius:6px; font-weight:700; font-size:14px; }
    .otp-box { margin:24px 0; padding:20px; background:#fdf6f7; border:2px solid #7B0D1E;
               border-radius:10px; text-align:center; }
    .otp-code { font-size:40px; font-weight:900; color:#7B0D1E; letter-spacing:10px;
                font-family:monospace; }
    .otp-note { font-size:12px; color:#6b7280; margin-top:8px; }
    .footer  { border-top:1px solid #e5e7eb; padding:20px 32px;
               color:#9ca3af; font-size:12px; text-align:center; }
    .stat-row { display:flex; gap:12px; margin:16px 0; }
    .stat-card { flex:1; background:#fdf6f7; border:1px solid #e5d0d2;
                 border-radius:8px; padding:14px; text-align:center; }
    .stat-card .num { font-size:24px; font-weight:700; color:#7B0D1E; }
    .stat-card .lbl { font-size:11px; color:#6b7280; margin-top:2px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>IUEA Library</h1>
      <p>International University of East Africa</p>
    </div>
    <div class="body">${bodyHtml}</div>
    <div class="footer">
      © ${new Date().getFullYear()} IUEA Library · All rights reserved.<br/>
      International University of East Africa, Kampala, Uganda
    </div>
  </div>
</body>
</html>`;

// ── Core send ─────────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  });
  if (error) throw new Error(error.message ?? JSON.stringify(error));
  return data;
};

// ── sendOtp ───────────────────────────────────────────────────────────────────
const sendOtp = async (user, otp, purpose = 'verify') => {
  const isReset   = purpose === 'reset';
  const heading   = isReset ? 'Password Reset Code' : 'Verify Your Email';
  const subline   = isReset
    ? 'Use this code to reset your password.'
    : 'Enter this code in the app to activate your account.';

  return sendEmail({
    to:      user.email,
    subject: isReset ? 'Your IUEA Library password reset code' : 'Your IUEA Library verification code',
    html: wrapHtml(`
      <h2>${heading}</h2>
      <p>Hi ${user.name},</p>
      <p>${subline}</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-note">Expires in 10 minutes · Do not share this code</div>
      </div>
      <p style="color:#6b7280;font-size:13px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    `),
    text: `Your IUEA Library ${isReset ? 'password reset' : 'verification'} code is: ${otp}\n\nExpires in 10 minutes. Do not share this code.`,
  });
};

// ── sendWelcomeEmail ──────────────────────────────────────────────────────────
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to:      user.email,
    subject: 'Welcome to IUEA Library!',
    html: wrapHtml(`
      <h2>Welcome, ${user.name}!</h2>
      <p>Your IUEA Library account has been verified and is ready to use.</p>
      <p>You now have access to thousands of books, academic journals, podcasts,
         and our AI reading assistant — all in one place.</p>
      <a class="cta" href="${WEB_URL}">Start Reading</a>
      <p style="color:#6b7280;font-size:13px;">Happy reading!<br/>The IUEA Library Team</p>
    `),
    text: `Welcome to IUEA Library, ${user.name}! Your account is ready. Visit ${WEB_URL} to start reading.`,
  });
};

// ── sendPasswordReset ─────────────────────────────────────────────────────────
// Kept for backward-compatibility; sendOtp(user, otp, 'reset') is preferred.
const sendPasswordReset = async (user, token) => {
  return sendOtp(user, token, 'reset');
};

// ── sendWeeklyDigest ──────────────────────────────────────────────────────────
const sendWeeklyDigest = async (user, stats = {}) => {
  const mins = stats.minutesRead ?? 0;
  const hrs  = Math.floor(mins / 60);
  const rem  = mins % 60;
  const time = hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`;

  return sendEmail({
    to:      user.email,
    subject: 'Your IUEA Library weekly summary',
    html: wrapHtml(`
      <h2>Your Weekly Reading Summary</h2>
      <p>Hi ${user.name}, here's what you accomplished this week:</p>
      <div class="stat-row">
        <div class="stat-card"><div class="num">${stats.booksRead ?? 0}</div><div class="lbl">Books Completed</div></div>
        <div class="stat-card"><div class="num">${time}</div><div class="lbl">Time Reading</div></div>
        <div class="stat-card"><div class="num">${stats.sessions ?? 0}</div><div class="lbl">Sessions</div></div>
      </div>
      ${stats.topBook ? `<p>You spent the most time reading <strong>${stats.topBook}</strong>.</p>` : ''}
      <a class="cta" href="${WEB_URL}">Keep Reading</a>
    `),
    text: `IUEA Library weekly summary for ${user.name}: ${stats.booksRead ?? 0} books, ${time} reading time.`,
  });
};

// ── Borrow notifications ──────────────────────────────────────────────────────
const sendBorrowRequestNotification = async (student, book) => {
  if (!process.env.ADMIN_EMAIL) return;
  return sendEmail({
    to:      process.env.ADMIN_EMAIL,
    subject: `New Borrow Request — ${book.title}`,
    html: wrapHtml(`
      <h2>New Borrow Request</h2>
      <p><strong>${student.name}</strong> (${student.email}) has requested to borrow:</p>
      <p style="font-size:1.1rem;font-weight:700;color:#7B0D1E;">${book.title}</p>
      <p style="color:#6b7280;">by ${book.author}</p>
      <a class="cta" href="${WEB_URL}/admin/loans">Review Request</a>
    `),
    text: `${student.name} requested to borrow "${book.title}".`,
  });
};

const sendBorrowApproved = async (student, loan, dueDate, shelfLocation, notes) => {
  const due = new Date(dueDate).toLocaleDateString('en-UG', { dateStyle: 'long' });
  return sendEmail({
    to:      student.email,
    subject: `Borrow Request Approved — ${loan.bookTitle}`,
    html: wrapHtml(`
      <h2>Your Request Was Approved!</h2>
      <p>Your request to borrow <strong>${loan.bookTitle}</strong> has been approved.</p>
      ${shelfLocation ? `<p><strong>Pickup location:</strong> ${shelfLocation}</p>` : ''}
      <p><strong>Due date:</strong> ${due}</p>
      ${notes ? `<p><strong>Note from library:</strong> ${notes}</p>` : ''}
      <p>Please pick up the book within 3 days or the reservation may be cancelled.</p>
      <a class="cta" href="${WEB_URL}/home/library/loans">View My Loans</a>
    `),
    text: `Your borrow request for "${loan.bookTitle}" was approved. Due: ${due}.`,
  });
};

const sendBorrowRejected = async (student, loan, notes) => {
  return sendEmail({
    to:      student.email,
    subject: `Borrow Request Update — ${loan.bookTitle}`,
    html: wrapHtml(`
      <h2>Request Not Approved</h2>
      <p>Your request to borrow <strong>${loan.bookTitle}</strong> could not be approved at this time.</p>
      ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ''}
      <p>Please visit the library or contact staff for more information.</p>
    `),
    text: `Your borrow request for "${loan.bookTitle}" was not approved. ${notes ?? ''}`,
  });
};

module.exports = {
  sendEmail,
  sendOtp,
  sendWelcomeEmail,
  sendPasswordReset,
  sendWeeklyDigest,
  sendBorrowRequestNotification,
  sendBorrowApproved,
  sendBorrowRejected,
};
