const router    = require('express').Router();
const authGuard = require('../middleware/authGuard');
const ctrl      = require('../controllers/auth.controller');

router.use(authGuard);

router.get('/notification-prefs',   ctrl.getNotificationPrefs);
router.patch('/notification-prefs', ctrl.updateNotificationPrefs);

module.exports = router;
