const router = require('express').Router();
const controller = require('../controllers/doctorController');

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id/stats', controller.stats);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;