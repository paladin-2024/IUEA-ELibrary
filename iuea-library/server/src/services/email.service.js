const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to:      user.email,
    subject: 'Welcome to IUEA Library!',
    html: `
      <h2>Welcome, ${user.name}!</h2>
      <p>Your account has been created successfully.</p>
      <p>You can now access thousands of books, listen to podcasts, and chat with our AI assistant.</p>
      <br/>
      <p>Happy reading!<br/>IUEA Library Team</p>
    `,
  });
};

module.exports = { sendEmail, sendWelcomeEmail };
