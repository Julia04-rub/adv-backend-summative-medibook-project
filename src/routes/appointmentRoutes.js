const router = require('express').Router();
const controller = require('../controllers/appointmentController');

router.post('/', controller.book);
router.get('/:id', controller.getOne);

module.exports = router;