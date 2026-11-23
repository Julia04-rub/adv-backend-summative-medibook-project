const router = require('express').Router();
const controller = require('../controllers/feedbackController');

router.get('/', controller.show);
router.post('/', controller.submit);

module.exports = router;