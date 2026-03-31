const router    = require('express').Router();
const authGuard = require('../middleware/authGuard');
const ctrl      = require('../controllers/translation.controller');

router.post('/', authGuard, ctrl.translate);  // POST /api/translate

module.exports = router;
