const router = require('express').Router();
const controller = require('../controllers/waitlistController');

router.post('/', controller.join);
router.get('/', controller.list);

module.exports = router;