const router    = require('express').Router();
const ctrl      = require('../controllers/podcast.controller');
const authGuard = require('../middleware/authGuard');

router.get('/',                ctrl.listPodcasts);
router.get('/:id',             ctrl.getPodcast);
router.post('/subscribe/:id',  authGuard, ctrl.toggleSubscribe);

module.exports = router;
