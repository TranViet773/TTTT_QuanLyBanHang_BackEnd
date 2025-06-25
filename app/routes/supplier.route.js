const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

// Chỉ cần đăng nhập là dùng được
router.post('/', authenticateToken,checkRoleMiddleware(["admin", "manager", "staff"]), supplierController.create);
router.get('/', authenticateToken,checkRoleMiddleware(["admin", "manager", "staff"]), supplierController.getAll);
router.get('/:id', authenticateToken, checkRoleMiddleware(["admin", "manager", "staff"]), supplierController.getById);
router.put('/:id', authenticateToken, checkRoleMiddleware(["admin", "manager", "staff"]), supplierController.update);
router.delete('/:id', authenticateToken, checkRoleMiddleware(["admin", "manager", "staff"]), supplierController.remove);

module.exports = router;
