const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const crypto           = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const prisma           = require('../config/prisma');
const koha             = require('../services/koha.service');
const emailService     = require('../services/email.service');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUser = (user) => {
  const { passwordHash, ...rest } = user;
  return { ...rest, _id: rest.id };
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, studentId, faculty } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ message: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 12);

    let kohaPatronId;
    try {
      if (studentId) {
        const patron = await koha.findPatronByStudentId(studentId);
        if (patron) kohaPatronId = String(patron.patron_id ?? patron.borrowernumber ?? '');
      }
      if (!kohaPatronId) {
        const created = await koha.createPatron({ name, email, studentId });
        if (created) kohaPatronId = String(created.patron_id ?? created.borrowernumber ?? '');
      }
    } catch (kohaErr) {
      console.warn('[auth.register] Koha sync failed (non-fatal):', kohaErr.message);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email:        email.toLowerCase(),
        passwordHash,
        studentId:    studentId    || null,
        faculty:      faculty      || null,
        kohaPatronId: kohaPatronId || null,
      },
    });

    const token = signToken(user.id, user.role);
    emailService.sendWelcomeEmail(user).catch(console.error);
    return res.status(201).json({ token, user: safeUser(user) });
  } catch (err) { next(err); }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash)
      return res.status(401).json({ message: 'Invalid credentials.' });
    if (!user.isActive)
      return res.status(403).json({ message: 'Account suspended. Contact library support.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = signToken(user.id, user.role);
    return res.json({ token, user: safeUser(user) });
  } catch (err) { next(err); }
};

// POST /api/auth/google
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Google ID token required.' });

    const ticket  = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    let isNewUser = false;
    let user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: { name: payload.name, email: payload.email.toLowerCase(), avatar: payload.picture },
      });
      try {
        const created = await koha.createPatron({ name: payload.name, email: payload.email });
        if (created) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { kohaPatronId: String(created.patron_id ?? created.borrowernumber ?? '') },
          });
        }
      } catch (kohaErr) {
        console.warn('[auth.google] Koha patron creation failed (non-fatal):', kohaErr.message);
      }
      emailService.sendWelcomeEmail(user).catch(console.error);
    } else if (!user.avatar && payload.picture) {
      user = await prisma.user.update({ where: { id: user.id }, data: { avatar: payload.picture } });
    }

    if (!user.isActive)
      return res.status(403).json({ message: 'Account suspended. Contact library support.' });

    const token = signToken(user.id, user.role);
    return res.json({ token, user: safeUser(user), isNewUser });
  } catch (err) { next(err); }
};

// GET /api/auth/me
const getMe = (req, res) => res.json(safeUser(req.user));

// PUT /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'faculty', 'avatar', 'readingGoal', 'preferredLanguages'];
    const data    = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (!Object.keys(data).length)
      return res.status(400).json({ message: 'No updatable fields provided.' });

    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    return res.json(safeUser(user));
  } catch (err) { next(err); }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always respond 200 to prevent email enumeration
    if (!user) return res.json({ message: 'If that email is registered, a reset link has been sent.' });

    const token    = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    });

    emailService.sendPasswordReset(user, token).catch(console.error);
    return res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) { next(err); }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ message: 'Token and new password are required.' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken:      token,
        passwordResetExpiresAt:  { gt: new Date() },
      },
    });

    if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired.' });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data:  {
        passwordHash,
        passwordResetToken:     null,
        passwordResetExpiresAt: null,
      },
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) { next(err); }
};

// POST /api/auth/fcm-token
const updateFcmToken = async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ message: 'token is required.' });
    const data = { fcmToken: token };
    if (platform === 'mobile') data.fcmTokenMobile = token;
    if (platform === 'web')    data.fcmTokenWeb    = token;
    await prisma.user.update({ where: { id: req.user.id }, data });
    return res.json({ message: 'FCM token updated.' });
  } catch (err) { next(err); }
};

module.exports = { register, login, googleAuth, getMe, updateMe, forgotPassword, resetPassword, updateFcmToken };
