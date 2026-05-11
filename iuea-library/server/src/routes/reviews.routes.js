const router    = require('express').Router();
const authGuard = require('../middleware/authGuard');
const validate  = require('../middleware/validate');
const ctrl      = require('../controllers/reviews.controller');
const s         = require('../schemas/reviews.schemas');

router.use(authGuard);

router.post('/:bookId',           validate(s.addReview),    ctrl.addReview);
router.get('/:bookId',            ctrl.getBookReviews);
router.delete('/:bookId',         ctrl.deleteReview);
router.post('/:bookId/helpful',   validate(s.voteHelpful),  ctrl.voteHelpful);
router.get('/my/:bookId',         ctrl.getMyReview);

module.exports = router;
