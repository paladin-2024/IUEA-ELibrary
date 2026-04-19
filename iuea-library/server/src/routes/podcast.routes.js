const router    = require('express').Router();
const ctrl      = require('../controllers/podcast.controller');
const authGuard = require('../middleware/authGuard');

// Public
router.get('/',              ctrl.listPodcasts);
router.get('/category/:cat', ctrl.getByCategory);

// Auth-required — must be declared before /:id to avoid route collision
router.get('/subscriptions',    authGuard, ctrl.getSubscriptions);
router.post('/subscribe/:id',   authGuard, ctrl.subscribe);
router.delete('/subscribe/:id', authGuard, ctrl.unsubscribe);

// Play count (public — no auth needed to count a play)
router.post('/:id/play', ctrl.trackPlay);

// Public detail (episodes included)
router.get('/:id', ctrl.getPodcast);

module.exports = router;
