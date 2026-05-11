const router    = require('express').Router();
const multer    = require('multer');
const ctrl      = require('../controllers/admin.controller');
const authGuard = require('../middleware/authGuard');
const adminOnly = require('../middleware/adminOnly');
const validate  = require('../middleware/validate');
const s         = require('../schemas/admin.schemas');

router.use(authGuard, adminOnly);

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'coverFile' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Cover must be an image.'));
    }
    cb(null, true);
  },
});

const bookUpload = upload.fields([
  { name: 'bookFile',  maxCount: 1 },
  { name: 'coverFile', maxCount: 1 },
]);

// ── Stats & analytics ─────────────────────────────────────────────────────────
router.get('/stats',                   ctrl.getStats);
router.get('/analytics',               ctrl.getAnalytics);
router.get('/analytics/top-books',     ctrl.getTopBooks);
router.get('/analytics/user-growth',   ctrl.getUserGrowth);
router.post('/notifications/push',     validate(s.sendPushNotification), ctrl.sendPushNotification);

// ── Books ─────────────────────────────────────────────────────────────────────
router.get('/books',             ctrl.getBooks);
router.get('/books/discover',    ctrl.discoverBooks);
router.post('/books/import',     ctrl.importBook);
router.post('/books',            bookUpload, validate(s.uploadBook), ctrl.uploadBook);
router.patch('/books/:id/toggle',ctrl.toggleBookStatus);
router.patch('/books/:id',       validate(s.updateBook), ctrl.updateBook);
router.delete('/books/:id',      ctrl.deleteBook);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users',               ctrl.getUsers);
router.get('/users/:id',           ctrl.getUserDetail);
router.patch('/users/:id/suspend', ctrl.suspendUser);
router.patch('/users/:id/role',    validate(s.updateUserRole), ctrl.updateUserRole);
router.delete('/users/:id',        ctrl.deleteUser);

// ── Sync ──────────────────────────────────────────────────────────────────────
router.post('/sync-podcasts', ctrl.syncPatrons);

// ── Podcasts ──────────────────────────────────────────────────────────────────
router.get('/podcasts',           ctrl.getPodcasts);
router.post('/podcasts',          validate(s.addPodcast),    ctrl.addPodcast);
router.patch('/podcasts/:id',     validate(s.updatePodcast), ctrl.updatePodcast);
router.delete('/podcasts/:id',    ctrl.deletePodcast);

module.exports = router;
