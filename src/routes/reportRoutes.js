const router = require('express').Router();
const controller = require('../controllers/reportController');

router.get('/doctors', controller.doctorsReport);
router.get('/busy-days', controller.busyDays);

module.exports = router;