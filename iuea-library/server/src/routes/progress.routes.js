const router    = require('express').Router();
const authGuard = require('../middleware/authGuard');
const validate  = require('../middleware/validate');
const ctrl      = require('../controllers/progress.controller');
const s         = require('../schemas/progress.schemas');

router.use(authGuard);

router.get('/',        ctrl.getAllProgress);
router.get('/:bookId', ctrl.loadProgress);
router.put('/:bookId', validate(s.saveProgress), ctrl.saveProgress);

module.exports = router;
