const router     = require('express').Router();
const ctrl       = require('../controllers/auth.controller');
const authGuard  = require('../middleware/authGuard');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register',         authLimiter, ctrl.register);
router.post('/login',            authLimiter, ctrl.login);
router.post('/google',           authLimiter, ctrl.googleAuth);
router.get('/me',                authGuard,   ctrl.getMe);
router.put('/me',                authGuard,   ctrl.updateMe);
router.post('/fcm-token',        authGuard,   ctrl.updateFcmToken);
router.post('/forgot-password',  authLimiter, ctrl.forgotPassword);
router.post('/reset-password',   authLimiter, ctrl.resetPassword);

module.exports = router;
