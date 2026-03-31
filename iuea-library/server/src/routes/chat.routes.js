const router    = require('express').Router();
const ctrl      = require('../controllers/chat.controller');
const authGuard = require('../middleware/authGuard');
const { chatLimiter } = require('../middleware/rateLimiter');

router.post('/:bookId',        authGuard, chatLimiter, ctrl.chat);
router.get('/:bookId/stream',  authGuard, ctrl.streamChat);
router.get('/:bookId/history', authGuard, ctrl.getHistory);
router.delete('/:bookId',      authGuard, ctrl.clearHistory);

module.exports = router;
