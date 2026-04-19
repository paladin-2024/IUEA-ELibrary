const router    = require('express').Router();
const authGuard = require('../middleware/authGuard');
const adminOnly = require('../middleware/adminOnly');
const ctrl      = require('../controllers/borrowing.controller');

router.use(authGuard);

// Student routes
router.post('/',            ctrl.requestBorrow);
router.get('/my',           ctrl.getMyLoans);
router.delete('/:id',       ctrl.cancelRequest);
router.post('/:id/renew',   ctrl.requestRenewal);

// Admin routes
router.get('/',             adminOnly, ctrl.getAllLoans);
router.get('/stats',        adminOnly, ctrl.getLoanStats);
router.patch('/:id',        adminOnly, ctrl.updateLoanStatus);

module.exports = router;
