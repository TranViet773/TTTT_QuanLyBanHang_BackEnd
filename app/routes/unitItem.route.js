const express = require('express');
const router = express.Router();    

const unitItemController = require('../controllers/unitItem.controller');
router.post('/', unitItemController.createUnitItem);
router.get('/', unitItemController.getAllUnitItem);
router.get('/:id', unitItemController.getUnitItemById);
router.put('/:id', unitItemController.updateUnitItem);
router.delete('/:id', unitItemController.deleteUnitItem);

module.exports = router;