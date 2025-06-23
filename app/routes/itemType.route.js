const express = require('express');
const router = express.Router();
const itemTypeController = require('../controllers/itemType.controller');
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

router.get('/', itemTypeController.getAllItemTypes);
router.get('/name/', itemTypeController.getItemTypeByName);
router.get('/:id', itemTypeController.getItemTypeById);
router.post('/', authenticateToken, checkRoleMiddleware(['admin', 'manager']), itemTypeController.createItemType);
router.put('/:id', authenticateToken, checkRoleMiddleware(['admin', 'manager']), itemTypeController.updateItemType);
router.delete('/:id', authenticateToken, checkRoleMiddleware(['admin', 'manager']), itemTypeController.deleteItemType);

module.exports = router;