'use strict';

const { z } = require('zod');

const email    = z.string({ error: 'Email is required.' }).email('Invalid email address.').toLowerCase();
const password = z.string({ error: 'Password is required.' }).min(8, 'Password must be at least 8 characters.');

const register = z.object({
  name:      z.string({ error: 'Name is required.' }).min(2, 'Name must be at least 2 characters.').trim(),
  email,
  password,
  studentId: z.string().trim().optional().nullable(),
  faculty:   z.string().trim().optional().nullable(),
});

const verifyEmail = z.object({
  email,
  otp: z.string().length(6, 'OTP must be 6 digits.').regex(/^\d+$/, 'OTP must be numeric.').trim(),
});

const resendOtp = z.object({ email });

const login = z.object({ email, password: z.string({ error: 'Password is required.' }).min(1, 'Password is required.') });

const googleAuth = z.object({
  idToken: z.string().min(1, 'Google ID token is required.'),
});

const forgotPassword = z.object({ email });

const resetPassword = z.object({
  email,
  otp:      z.string().length(6).regex(/^\d+$/).trim(),
  password,
});

const updateMe = z.object({
  name:               z.string().min(2).trim().optional(),
  faculty:            z.string().trim().optional().nullable(),
  avatar:             z.string().url().optional().nullable(),
  readingGoal:        z.number().int().min(1).max(365).optional(),
  preferredLanguages: z.array(z.string()).optional(),
  readingPrefs:       z.record(z.unknown()).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'No updatable fields provided.' });

const updateFcmToken = z.object({
  token:    z.string().min(1, 'token is required.'),
  platform: z.enum(['mobile', 'web']).optional(),
});

const updateNotificationPrefs = z.object({
  prefs: z.record(z.unknown()),
});

module.exports = {
  register, verifyEmail, resendOtp, login, googleAuth,
  forgotPassword, resetPassword, updateMe, updateFcmToken,
  updateNotificationPrefs,
};
