const router    = require('express').Router();
const ctrl      = require('../controllers/books.controller');
const authGuard = require('../middleware/authGuard');

router.get('/',           ctrl.listBooks);
router.get('/featured',   ctrl.getFeatured);
router.get('/search',     ctrl.searchBooks);
router.get('/:id',        authGuard, ctrl.getBook);
router.get('/:id/similar', ctrl.getSimilar);

module.exports = router;
