const router    = require('express').Router();
const ctrl      = require('../controllers/translation.controller');
const authGuard = require('../middleware/authGuard');

router.post('/', authGuard, ctrl.translate);

module.exports = router;
