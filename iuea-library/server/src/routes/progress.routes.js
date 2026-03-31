const router    = require('express').Router();
const authGuard = require('../middleware/authGuard');
const ctrl      = require('../controllers/progress.controller');

// All progress routes require authentication
router.use(authGuard);

router.get('/',        ctrl.getAllProgress);  // GET  /api/progress
router.get('/:bookId', ctrl.loadProgress);   // GET  /api/progress/:bookId
router.put('/:bookId', ctrl.saveProgress);   // PUT  /api/progress/:bookId

module.exports = router;
