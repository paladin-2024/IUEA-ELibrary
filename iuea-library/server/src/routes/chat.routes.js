const router     = require('express').Router();
const ctrl       = require('../controllers/chat.controller');
const authGuard  = require('../middleware/authGuard');
const { chatLimiter } = require('../middleware/rateLimiter');

router.post('/:bookId',         authGuard, chatLimiter, ctrl.sendMessage);
router.get('/:bookId/history',  authGuard, ctrl.getHistory);

module.exports = router;
