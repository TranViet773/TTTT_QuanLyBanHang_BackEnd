const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Chỉ cần đăng nhập là dùng được
router.post('/', authenticateToken, supplierController.create);
router.get('/', authenticateToken, supplierController.getAll);
router.get('/:id', authenticateToken, supplierController.getById);
router.put('/:id', authenticateToken, supplierController.update);
router.delete('/:id', authenticateToken, supplierController.remove);

module.exports = router;
