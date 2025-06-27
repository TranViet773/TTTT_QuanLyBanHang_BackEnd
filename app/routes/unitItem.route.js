const express = require('express');
const router = express.Router();    
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');
const unitItemController = require('../controllers/unitItem.controller');

router.post('/', authenticateToken, checkRoleMiddleware(['admin']), unitItemController.createUnitItem);
router.get('/', unitItemController.getAllUnitItem);
router.get('/:id', unitItemController.getUnitItemById);
router.put('/:id', authenticateToken, checkRoleMiddleware(['admin']), unitItemController.updateUnitItem);
router.delete('/:id', authenticateToken, checkRoleMiddleware(['admin']), unitItemController.deleteUnitItem);

module.exports = router;