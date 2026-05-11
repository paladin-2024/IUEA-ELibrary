const router    = require('express').Router();
const ctrl      = require('../controllers/chat.controller');
const authGuard = require('../middleware/authGuard');
const validate  = require('../middleware/validate');
const { chatLimiter } = require('../middleware/rateLimiter');
const s         = require('../schemas/chat.schemas');

router.post('/:bookId',        authGuard, chatLimiter, validate(s.chat), ctrl.chat);
router.get('/:bookId/stream',  authGuard, ctrl.streamChat);
router.get('/:bookId/history', authGuard, ctrl.getHistory);
router.delete('/:bookId',      authGuard, ctrl.clearHistory);

module.exports = router;
