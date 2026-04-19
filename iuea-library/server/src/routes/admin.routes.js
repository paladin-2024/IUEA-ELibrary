const router    = require('express').Router();
const multer    = require('multer');
const ctrl      = require('../controllers/admin.controller');
const authGuard = require('../middleware/authGuard');
const adminOnly = require('../middleware/adminOnly');

// All admin routes require auth + admin role
router.use(authGuard, adminOnly);

// Multer: memory storage (files go straight to R2 / local fallback)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/epub+zip',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    // Allow any file when fieldname is bookFile; restrict covers to images
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
router.post('/notifications/push',     ctrl.sendPushNotification);

// ── Books ─────────────────────────────────────────────────────────────────────
router.get('/books',             ctrl.getBooks);
router.post('/books',            bookUpload, ctrl.uploadBook);
router.patch('/books/:id/toggle',ctrl.toggleBookStatus);
router.patch('/books/:id',       ctrl.updateBook);
router.delete('/books/:id',      ctrl.deleteBook);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users',               ctrl.getUsers);
router.get('/users/:id',           ctrl.getUserDetail);
router.patch('/users/:id/suspend', ctrl.suspendUser);
router.patch('/users/:id/role',    ctrl.updateUserRole);
router.delete('/users/:id',        ctrl.deleteUser);

// ── Sync ──────────────────────────────────────────────────────────────────────
router.post('/sync-koha',    ctrl.syncKoha);
router.post('/sync-patrons', ctrl.syncPatrons);

// ── Podcasts ──────────────────────────────────────────────────────────────────
router.post('/podcasts', ctrl.addPodcast);

module.exports = router;
