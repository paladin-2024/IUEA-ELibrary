const router    = require('express').Router();
const ctrl      = require('../controllers/audio.controller');
const authGuard = require('../middleware/authGuard');

router.get('/narrate/:bookId', authGuard, ctrl.getNarration);
router.post('/generate',      authGuard, ctrl.generateAudio);

module.exports = router;
