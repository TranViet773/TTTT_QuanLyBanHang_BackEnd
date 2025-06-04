const express = require('express');
const router = express.Router();
const salesInvoiceController = require('../controllers/salesInvoice.controller');
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

// Post 
router.post('/', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.createInvoice)
router.put('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.updateInvoice)
router.get('/', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.getAllInvoices)
router.get('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.getInvoiceByCode)

module.exports = router;