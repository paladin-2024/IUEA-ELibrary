const router    = require('express').Router();
const ctrl      = require('../controllers/admin.controller');
const authGuard = require('../middleware/authGuard');
const adminOnly = require('../middleware/adminOnly');

router.use(authGuard, adminOnly);

router.get('/stats',          ctrl.getStats);
router.get('/users',          ctrl.listUsers);
router.post('/books/sync',    ctrl.syncKohaBooks);
router.post('/books',         ctrl.createBook);
router.patch('/books/:id',    ctrl.updateBook);
router.delete('/books/:id',   ctrl.deleteBook);

module.exports = router;
