const express = require('express');
const router = express.Router();

const itemController = require('../controllers/items.controller');
const authenticateMiddleware = require('../middlewares/auth.middleware');

router.get('/', authenticateMiddleware.authenticateToken, itemController.getAllItems);
router.get('/:code', authenticateMiddleware.authenticateToken, itemController.getItemByCode);
router.post('/', authenticateMiddleware.authenticateToken, itemController.createItem);
router.get('/item-type/:id', authenticateMiddleware.authenticateToken, itemController.getAllByItemTypeId);
router.put('/:id', authenticateMiddleware.authenticateToken, itemController.updateItem);
router.delete('/:id', authenticateMiddleware.authenticateToken, itemController.deleteItem);

module.exports = router;