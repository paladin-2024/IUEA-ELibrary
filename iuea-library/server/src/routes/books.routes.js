const router    = require('express').Router();
const ctrl      = require('../controllers/books.controller');
const authGuard = require('../middleware/authGuard');

router.get('/',            ctrl.getBooks);
router.get('/featured',    ctrl.getFeatured);
router.get('/search',      ctrl.searchBooks);
router.get('/continue',    authGuard, ctrl.getContinueReading);
router.post('/resolve',    ctrl.resolveBook);
router.get('/:id',         ctrl.getBookById);
router.get('/:id/similar', ctrl.getSimilarBooks);

module.exports = router;
