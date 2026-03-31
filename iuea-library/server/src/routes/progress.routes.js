const router    = require('express').Router();
const ctrl      = require('../controllers/progress.controller');
const authGuard = require('../middleware/authGuard');

router.use(authGuard);

router.get('/',           ctrl.getAllProgress);
router.get('/:bookId',    ctrl.getProgress);
router.put('/:bookId',    ctrl.saveProgress);

module.exports = router;
