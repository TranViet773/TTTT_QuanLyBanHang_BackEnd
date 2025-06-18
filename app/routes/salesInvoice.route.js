const express = require('express');
const router = express.Router();
const salesInvoiceController = require('../controllers/salesInvoice.controller');
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');
const { checkRoleForCreatingMiddleware } = require('../middlewares/invoices.middleware')

// Post 
router.post('/', authenticateToken, checkRoleForCreatingMiddleware, salesInvoiceController.createInvoice)
router.put('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.updateInvoice)
router.put('/removing-items/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.deleteItems)
router.get('/', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.getAllInvoices)
router.get('/statistic-based-on-status', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.statisticInvoiceBasedOnStatus)
router.get('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.getInvoiceByCode)
router.delete('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.deleteInvoice)

module.exports = router;