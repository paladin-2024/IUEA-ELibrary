const router    = require('express').Router();
const authGuard = require('../middleware/authGuard');
const ctrl      = require('../controllers/reviews.controller');

router.use(authGuard);

router.post('/:bookId',           ctrl.addReview);
router.get('/:bookId',            ctrl.getBookReviews);
router.delete('/:bookId',         ctrl.deleteReview);
router.post('/:bookId/helpful',   ctrl.voteHelpful);
router.get('/my/:bookId',         ctrl.getMyReview);

module.exports = router;
