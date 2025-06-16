const express = require('express');
const router = express.Router();
const purchaseInvoiceController = require('../controllers/purchaseInvoice.controller');
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

// Post 
router.post('/', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.createInvoice)
router.put('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.updateInvoice)
router.get('/', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.getAllInvoices)
router.get('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.getInvoiceByCode)
router.delete('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.deleteInvoice)
router.put('/removing-items/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.deleteItems)

module.exports = router;