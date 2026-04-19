const router    = require('express').Router();
const authGuard = require('../middleware/authGuard');
const { getStreak } = require('../controllers/streaks.controller');

router.use(authGuard);
router.get('/', getStreak);

module.exports = router;
