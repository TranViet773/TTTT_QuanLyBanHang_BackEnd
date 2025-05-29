const express = require('express');
const router = express.Router();
const itemTypeController = require('../controllers/itemType.controller');
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

router.get('/', itemTypeController.getAllItemTypes);
router.get('/name/', itemTypeController.getItemTypeByName);
router.get('/:id', itemTypeController.getItemTypeById);
router.post('/', authenticateToken, itemTypeController.createItemType);
router.put('/:id', authenticateToken, itemTypeController.updateItemType);
router.delete('/:id', authenticateToken, itemTypeController.deleteItemType);

module.exports = router;