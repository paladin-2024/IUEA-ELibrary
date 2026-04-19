const router    = require('express').Router();
const authGuard = require('../middleware/authGuard');
const ctrl      = require('../controllers/library.controller');

// All library routes require authentication
router.use(authGuard);

// Saved books
router.get('/saved',              ctrl.getSaved);
router.post('/save/:bookId',      ctrl.saveBook);
router.delete('/save/:bookId',    ctrl.unsaveBook);

// Highlights
router.get('/highlights',                          ctrl.getHighlights);
router.delete('/highlights/:bookId/:highlightId',  ctrl.deleteHighlight);

// Collections
router.get('/collections',                  ctrl.getCollections);
router.post('/collections',                 ctrl.createCollection);
router.post('/collections/:id/books',       ctrl.addBookToCollection);
router.delete('/collections/:id',           ctrl.deleteCollection);

// Downloads
router.get('/downloads',               ctrl.getDownloads);
router.post('/downloads/:bookId',      ctrl.markDownloaded);
router.delete('/downloads/:bookId',    ctrl.removeDownload);

module.exports = router;
