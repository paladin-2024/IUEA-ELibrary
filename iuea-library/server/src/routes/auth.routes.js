const router     = require('express').Router();
const multer     = require('multer');
const ctrl       = require('../controllers/auth.controller');
const authGuard  = require('../middleware/authGuard');
const { authLimiter } = require('../middleware/rateLimiter');

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Must be an image.'));
    cb(null, true);
  },
}).single('avatar');

router.post('/register',         authLimiter, ctrl.register);
router.post('/login',            authLimiter, ctrl.login);
router.post('/google',           authLimiter, ctrl.googleAuth);
router.get('/me',                authGuard,   ctrl.getMe);
router.put('/me',                authGuard,   ctrl.updateMe);
router.post('/avatar',           authGuard,   avatarUpload, ctrl.uploadAvatar);
router.post('/fcm-token',        authGuard,   ctrl.updateFcmToken);
router.post('/forgot-password',  authLimiter, ctrl.forgotPassword);
router.post('/reset-password',   authLimiter, ctrl.resetPassword);

module.exports = router;
