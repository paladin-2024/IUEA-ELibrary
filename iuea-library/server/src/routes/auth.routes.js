const router     = require('express').Router();
const multer     = require('multer');
const ctrl       = require('../controllers/auth.controller');
const authGuard  = require('../middleware/authGuard');
const validate   = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const s          = require('../schemas/auth.schemas');

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Must be an image.'));
    cb(null, true);
  },
}).single('avatar');

router.post('/register',        authLimiter, validate(s.register),                ctrl.register);
router.post('/verify-email',    authLimiter, validate(s.verifyEmail),              ctrl.verifyEmail);
router.post('/resend-otp',      authLimiter, validate(s.resendOtp),                ctrl.resendOtp);
router.post('/login',           authLimiter, validate(s.login),                    ctrl.login);
router.post('/google',          authLimiter, validate(s.googleAuth),               ctrl.googleAuth);
router.get ('/me',              authGuard,                                          ctrl.getMe);
router.put ('/me',              authGuard,   validate(s.updateMe),                 ctrl.updateMe);
router.post('/avatar',          authGuard,   avatarUpload,                          ctrl.uploadAvatar);
router.post('/fcm-token',       authGuard,   validate(s.updateFcmToken),           ctrl.updateFcmToken);
router.post('/forgot-password', authLimiter, validate(s.forgotPassword),           ctrl.forgotPassword);
router.post('/reset-password',  authLimiter, validate(s.resetPassword),            ctrl.resetPassword);

module.exports = router;
