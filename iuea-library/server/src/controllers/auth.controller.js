const jwt            = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { User }       = require('../models');
const { sendWelcomeEmail } = require('../services/email.service');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, language } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered.' });

    const user  = await User.create({ name, email, password, language: language || 'en' });
    const token = signToken(user._id);

    sendWelcomeEmail(user).catch(console.error);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/google
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Google ID token required.' });

    const ticket  = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });
    if (!user) {
      user = await User.create({
        name:     payload.name,
        email:    payload.email,
        googleId: payload.sub,
        avatar:   payload.picture,
      });
      sendWelcomeEmail(user).catch(console.error);
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.avatar   = payload.picture || user.avatar;
      await user.save();
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({ token: signToken(user._id), user });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// POST /api/auth/fcm-token
const updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    req.user.fcmToken = fcmToken;
    await req.user.save();
    res.json({ message: 'FCM token updated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, googleAuth, getMe, updateFcmToken };
