'use strict';

const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const crypto           = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const prisma           = require('../config/prisma');
const emailService     = require('../services/email.service');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS   = 30 * 60 * 1000; // 30 minutes
const OTP_TTL_MS         = 10 * 60 * 1000; // 10 minutes

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// In dev, log OTPs so you can test without verified email delivery.
const logOtp = (email, otp, purpose) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n🔑 OTP [${purpose}] for ${email}: ${otp}\n`);
  }
};

const signToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUser = (user) => {
  const {
    passwordHash, passwordResetToken, passwordResetExpiresAt,
    emailOtp, emailOtpExpiresAt, loginAttempts, lockedUntil,
    ...rest
  } = user;
  return rest;
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, studentId, faculty } = req.body;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      // If unverified and OTP expired, allow re-registration by resending a new OTP
      if (!existing.emailVerified) {
        const otp       = generateOtp();
        const expiresAt = new Date(Date.now() + OTP_TTL_MS);
        await prisma.user.update({
          where: { id: existing.id },
          data:  { emailOtp: otp, emailOtpExpiresAt: expiresAt },
        });
        logOtp(existing.email, otp, 'verify');
        emailService.sendOtp(existing, otp, 'verify').catch(console.error);
        return res.status(200).json({
          requiresVerification: true,
          email: existing.email,
          message: 'Account pending verification. A new code has been sent to your email.',
        });
      }
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otp          = generateOtp();
    const expiresAt    = new Date(Date.now() + OTP_TTL_MS);

    const user = await prisma.user.create({
      data: {
        name,
        email:            email.toLowerCase(),
        passwordHash,
        studentId:        studentId || null,
        faculty:          faculty   || null,
        emailVerified:    false,
        emailOtp:         otp,
        emailOtpExpiresAt: expiresAt,
      },
    });

    logOtp(user.email, otp, 'verify');
    emailService.sendOtp(user, otp, 'verify').catch(console.error);

    return res.status(201).json({
      requiresVerification: true,
      email: user.email,
      message: 'Account created. Please check your email for a 6-digit verification code.',
    });
  } catch (err) { next(err); }
};

// POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user)
      return res.status(400).json({ message: 'Invalid or expired code.' });

    if (user.emailVerified)
      return res.status(400).json({ message: 'Email already verified.' });

    if (
      !user.emailOtp ||
      user.emailOtp !== otp.trim() ||
      !user.emailOtpExpiresAt ||
      new Date() > user.emailOtpExpiresAt
    ) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data:  {
        emailVerified:     true,
        emailOtp:          null,
        emailOtpExpiresAt: null,
      },
    });

    // Send welcome email now that the account is confirmed
    emailService.sendWelcomeEmail(updated).catch(console.error);

    const token = signToken(updated.id, updated.role);
    return res.json({ token, user: safeUser(updated) });
  } catch (err) { next(err); }
};

// POST /api/auth/resend-otp
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always respond the same to prevent enumeration
    if (!user || user.emailVerified)
      return res.json({ message: 'If that email is pending verification, a new code has been sent.' });

    const otp       = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await prisma.user.update({
      where: { id: user.id },
      data:  { emailOtp: otp, emailOtpExpiresAt: expiresAt },
    });
    logOtp(user.email, otp, 'verify');
    emailService.sendOtp(user, otp, 'verify').catch(console.error);

    return res.json({ message: 'If that email is pending verification, a new code has been sent.' });
  } catch (err) { next(err); }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash)
      return res.status(401).json({ message: 'Invalid credentials.' });

    // Account lockout check
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Account temporarily locked. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
      });
    }

    if (!user.isActive)
      return res.status(403).json({ message: 'Account suspended. Contact library support.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const attempts = (user.loginAttempts ?? 0) + 1;
      const shouldLock = attempts >= MAX_LOGIN_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil:   shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
        },
      });
      if (shouldLock) {
        return res.status(423).json({
          message: `Too many failed attempts. Account locked for 30 minutes.`,
        });
      }
      const remaining = MAX_LOGIN_ATTEMPTS - attempts;
      return res.status(401).json({
        message: `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      });
    }

    // Reset lockout on successful password
    if (user.loginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data:  { loginAttempts: 0, lockedUntil: null },
      });
    }

    // Require email verification
    if (!user.emailVerified) {
      const otp       = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);
      await prisma.user.update({
        where: { id: user.id },
        data:  { emailOtp: otp, emailOtpExpiresAt: expiresAt },
      });
      logOtp(user.email, otp, 'verify');
      emailService.sendOtp(user, otp, 'verify').catch(console.error);
      return res.status(200).json({
        requiresVerification: true,
        email: user.email,
        message: 'Please verify your email. A new code has been sent.',
      });
    }

    const token = signToken(user.id, user.role);
    return res.json({ token, user: safeUser(user) });
  } catch (err) { next(err); }
};

// POST /api/auth/google
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    const validAudiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_WEB_CLIENT_ID,
    ].filter(Boolean);
    const ticket  = await googleClient.verifyIdToken({ idToken, audience: validAudiences });
    const payload = ticket.getPayload();

    let isNewUser = false;
    let user = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          name:          payload.name,
          email:         payload.email.toLowerCase(),
          avatar:        payload.picture,
          emailVerified: true, // Google already verified the email
        },
      });
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
    const data = req.body;

    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    return res.json(safeUser(user));
  } catch (err) { next(err); }
};

// POST /api/auth/avatar
const uploadAvatar = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No image file provided.' });

    const { uploadAvatar: uploadAvatarFile } = require('../services/r2.service');
    const avatarUrl = await uploadAvatarFile(file, req.user.id);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data:  { avatar: avatarUrl },
    });
    return res.json(safeUser(user));
  } catch (err) { next(err); }
};

// GET /api/profile/notification-prefs
const getNotificationPrefs = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { notificationPrefs: true },
    });
    return res.json({ prefs: user?.notificationPrefs ?? {} });
  } catch (err) { next(err); }
};

// PATCH /api/profile/notification-prefs
const updateNotificationPrefs = async (req, res, next) => {
  try {
    const { prefs } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data:  { notificationPrefs: prefs },
    });
    return res.json({ prefs: user.notificationPrefs });
  } catch (err) { next(err); }
};

// POST /api/auth/forgot-password  — sends a 6-digit OTP
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Anti-enumeration: always respond 200
    if (!user) return res.json({ message: 'If that email is registered, a reset code has been sent.' });

    const otp       = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordResetToken: otp, passwordResetExpiresAt: expiresAt },
    });

    logOtp(user.email, otp, 'reset');
    emailService.sendOtp(user, otp, 'reset').catch(console.error);
    return res.json({ message: 'If that email is registered, a reset code has been sent.' });
  } catch (err) { next(err); }
};

// POST /api/auth/reset-password  — { email, otp, password }
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (
      !user ||
      !user.passwordResetToken ||
      user.passwordResetToken !== otp.trim() ||
      !user.passwordResetExpiresAt ||
      new Date() > user.passwordResetExpiresAt
    ) {
      return res.status(400).json({ message: 'Reset code is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data:  {
        passwordHash,
        passwordResetToken:     null,
        passwordResetExpiresAt: null,
        loginAttempts:          0,
        lockedUntil:            null,
      },
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) { next(err); }
};

// POST /api/auth/fcm-token
const updateFcmToken = async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    const data = { fcmToken: token };
    if (platform === 'mobile') data.fcmTokenMobile = token;
    if (platform === 'web')    data.fcmTokenWeb    = token;
    await prisma.user.update({ where: { id: req.user.id }, data });
    return res.json({ message: 'FCM token updated.' });
  } catch (err) { next(err); }
};

module.exports = {
  register, login, googleAuth,
  verifyEmail, resendOtp,
  getMe, updateMe, uploadAvatar,
  getNotificationPrefs, updateNotificationPrefs,
  forgotPassword, resetPassword, updateFcmToken,
};
