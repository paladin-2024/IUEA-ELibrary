const bcrypt           = require('bcryptjs');
const jwt              = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { User }         = require('../models');
const koha             = require('../services/koha.service');
const emailService     = require('../services/email.service');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (userId, role) =>
  jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

/** Strip passwordHash and __v before sending user to client */
const safeUser = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, studentId, faculty } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // ── Koha patron sync (non-fatal) ─────────────────────────────────────────
    let kohaPatronId;
    try {
      if (studentId) {
        const patron = await koha.findPatronByStudentId(studentId);
        if (patron) {
          kohaPatronId = String(patron.patron_id ?? patron.borrowernumber ?? '');
        }
      }
      if (!kohaPatronId) {
        const created = await koha.createPatron({ name, email, studentId });
        if (created) {
          kohaPatronId = String(created.patron_id ?? created.borrowernumber ?? '');
        }
      }
    } catch (kohaErr) {
      console.warn('[auth.register] Koha sync failed (non-fatal):', kohaErr.message);
    }

    const user = await User.create({
      name,
      email:        email.toLowerCase(),
      passwordHash,
      studentId:    studentId    || undefined,
      faculty:      faculty      || undefined,
      kohaPatronId: kohaPatronId || undefined,
    });

    const token = signToken(user._id, user.role);
    emailService.sendWelcomeEmail(user).catch(console.error);

    return res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // passwordHash is not selected by default — select it explicitly
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account suspended. Contact library support.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(user._id, user.role);
    return res.json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/google ─────────────────────────────────────────────────────
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token required.' });
    }

    const ticket  = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let isNewUser = false;
    let user = await User.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      isNewUser = true;
      user = await User.create({
        name:   payload.name,
        email:  payload.email.toLowerCase(),
        avatar: payload.picture,
        // passwordHash intentionally omitted — Google-only user
      });

      // Register Koha patron for new Google users (non-fatal)
      try {
        const created = await koha.createPatron({ name: payload.name, email: payload.email });
        if (created) {
          user.kohaPatronId = String(created.patron_id ?? created.borrowernumber ?? '');
          await user.save();
        }
      } catch (kohaErr) {
        console.warn('[auth.google] Koha patron creation failed (non-fatal):', kohaErr.message);
      }

      emailService.sendWelcomeEmail(user).catch(console.error);

    } else if (!user.avatar && payload.picture) {
      user.avatar = payload.picture;
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account suspended. Contact library support.' });
    }

    const token = signToken(user._id, user.role);
    return res.json({ token, user: safeUser(user), isNewUser });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = (req, res) => {
  res.json(safeUser(req.user));
};

// ── POST /api/auth/fcm-token ──────────────────────────────────────────────────
const updateFcmToken = async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'token is required.' });
    }

    // Always update the shared fallback; also update platform-specific field
    const update = { fcmToken: token };
    if (platform === 'mobile') update.fcmTokenMobile = token;
    if (platform === 'web')    update.fcmTokenWeb    = token;

    await User.findByIdAndUpdate(req.user._id, { $set: update });
    return res.json({ message: 'FCM token updated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, googleAuth, getMe, updateFcmToken };
