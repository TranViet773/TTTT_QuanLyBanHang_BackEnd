const express = require('express');
const router = express.Router();

const itemController = require('../controllers/items.controller');
const authenticateMiddleware = require('../middlewares/auth.middleware');

router.get('/', itemController.getAllItems);
router.get('/:code', itemController.getItemByCode);
router.post('/', authenticateMiddleware.authenticateToken, itemController.createItem);
router.get('/item-type/:id', itemController.getAllByItemTypeId);
router.put('/:id', authenticateMiddleware.authenticateToken, itemController.updateItem);
router.delete('/:id', authenticateMiddleware.authenticateToken, itemController.deleteItem);
router.put('/stock/:id', authenticateMiddleware.authenticateToken, itemController.updateItemStock);
// router.get('/bom-materials/:id', authenticateMiddleware.authenticateToken, itemController.getBOMMaterialsByItemId);
router.post('/bom-materials/:id', authenticateMiddleware.authenticateToken, itemController.addBOMMaterialToItem);
router.put('/bom-materials/:id', authenticateMiddleware.authenticateToken, itemController.updateBOMMaterialInItem);
router.post('/delete-bom-materials/:id', authenticateMiddleware.authenticateToken, itemController.deleteBOMMaterialInItem);
router.put('/price/:id', authenticateMiddleware.authenticateToken, itemController.updateItemPrice);
router.put('/images/:id', authenticateMiddleware.authenticateToken, itemController.updateListImageForItem);
router.put('/add-voucher/:id', authenticateMiddleware.authenticateToken, itemController.addVoucherForItem);
router.put('/remove-voucher/:id', authenticateMiddleware.authenticateToken, itemController.removeVoucherForItem);
module.exports = router;