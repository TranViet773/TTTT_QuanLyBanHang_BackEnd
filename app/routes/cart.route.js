const cartController = require('../controllers/cart.controller');
const authenticateMiddleware = require('../middlewares/auth.middleware')
const express = require('express');
const router = express.Router();

router.post('/', authenticateMiddleware.authenticateToken, cartController.addItemToCart);
router.get('/', authenticateMiddleware.authenticateToken, cartController.getCartByUser);
router.put('/quantity', authenticateMiddleware.authenticateToken, cartController.updateQuantityItemInCart);
router.put('/item', authenticateMiddleware.authenticateToken, cartController.removeItemFromCart);
router.put('/items', authenticateMiddleware.authenticateToken, cartController.removeItemsFromCart);
module.exports = router;