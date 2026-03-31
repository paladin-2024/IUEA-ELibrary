const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
  const info = await transporter.sendMail({
    from:    `"IUEA Library" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  });
  return info;
};

// ── sendWelcomeEmail ──────────────────────────────────────────────────────────
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to:      user.email,
    subject: 'Welcome to IUEA Library!',
    html: wrapHtml(`
      <h2>Welcome, ${user.name}!</h2>
      <p>Your IUEA Library account has been created successfully.</p>
      <p>You now have access to thousands of books, academic journals, podcasts,
         and our AI reading assistant — all in one place.</p>
      <a class="cta" href="${process.env.WEB_URL || 'http://localhost:5173'}">
        Start Reading
      </a>
      <p style="color:#6b7280;font-size:13px;">
        Happy reading!<br/>The IUEA Library Team
      </p>
    `),
    text: `Welcome to IUEA Library, ${user.name}! Your account is ready. Visit ${process.env.WEB_URL || 'http://localhost:5173'} to start reading.`,
  });
};

// ── sendPasswordReset ─────────────────────────────────────────────────────────
const sendPasswordReset = async (user, token) => {
  const resetUrl = `${process.env.WEB_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  return sendEmail({
    to:      user.email,
    subject: 'Reset your IUEA Library password',
    html: wrapHtml(`
      <h2>Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>We received a request to reset the password for your IUEA Library account.
         Click the button below to choose a new password.</p>
      <a class="cta" href="${resetUrl}">Reset Password</a>
      <p style="margin-top:20px;color:#6b7280;font-size:13px;">
        This link expires in <strong>1 hour</strong>.
        If you didn't request a password reset, you can safely ignore this email —
        your password will not be changed.
      </p>
      <p style="color:#6b7280;font-size:12px;word-break:break-all;">
        If the button doesn't work, copy this link into your browser:<br/>
        ${resetUrl}
      </p>
    `),
    text: `Reset your IUEA Library password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  });
};

// ── sendWeeklyDigest ──────────────────────────────────────────────────────────
// stats = { booksRead, minutesRead, sessions, topBook? }
const sendWeeklyDigest = async (user, stats = {}) => {
  const mins = stats.minutesRead ?? 0;
  const hrs  = Math.floor(mins / 60);
  const rem  = mins % 60;
  const time = hrs > 0 ? `${hrs}h ${rem}m` : `${rem}m`;

  return sendEmail({
    to:      user.email,
    subject: `Your IUEA Library weekly summary`,
    html: wrapHtml(`
      <h2>Your Weekly Reading Summary</h2>
      <p>Hi ${user.name}, here's what you accomplished this week:</p>
      <div class="stat-row">
        <div class="stat-card">
          <div class="num">${stats.booksRead ?? 0}</div>
          <div class="lbl">Books Completed</div>
        </div>
        <div class="stat-card">
          <div class="num">${time}</div>
          <div class="lbl">Time Reading</div>
        </div>
        <div class="stat-card">
          <div class="num">${stats.sessions ?? 0}</div>
          <div class="lbl">Sessions</div>
        </div>
      </div>
      ${stats.topBook ? `<p>You spent the most time reading <strong>${stats.topBook}</strong> — great choice!</p>` : ''}
      <a class="cta" href="${process.env.WEB_URL || 'http://localhost:5173'}">
        Keep Reading
      </a>
    `),
    text: `IUEA Library weekly summary for ${user.name}: ${stats.booksRead ?? 0} books, ${time} reading time, ${stats.sessions ?? 0} sessions.`,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordReset,
  sendWeeklyDigest,
};
