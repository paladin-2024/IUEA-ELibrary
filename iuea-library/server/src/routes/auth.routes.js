const router     = require('express').Router();
const ctrl       = require('../controllers/auth.controller');
const authGuard  = require('../middleware/authGuard');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register',   authLimiter, ctrl.register);
router.post('/login',      authLimiter, ctrl.login);
router.post('/google',     authLimiter, ctrl.googleAuth);
router.get('/me',          authGuard,   ctrl.getMe);
router.post('/fcm-token',  authGuard,   ctrl.updateFcmToken);

module.exports = router;
