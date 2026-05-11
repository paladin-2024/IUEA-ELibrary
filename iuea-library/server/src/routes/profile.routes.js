const router    = require('express').Router();
const authGuard = require('../middleware/authGuard');
const validate  = require('../middleware/validate');
const ctrl      = require('../controllers/auth.controller');
const s         = require('../schemas/auth.schemas');

router.use(authGuard);

router.get('/notification-prefs',   ctrl.getNotificationPrefs);
router.patch('/notification-prefs', validate(s.updateNotificationPrefs), ctrl.updateNotificationPrefs);

module.exports = router;
