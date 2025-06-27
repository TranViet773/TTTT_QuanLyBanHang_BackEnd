const express = require('express');
const router = express.Router();
const purchaseInvoiceController = require('../controllers/purchaseInvoice.controller');
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');
const { checkRoleForPurchaseInvoiceMiddleware } = require('../middlewares/invoices.middleware')

// Post 
router.post('/', authenticateToken, checkRoleForPurchaseInvoiceMiddleware, purchaseInvoiceController.createInvoice)
router.put('/:invoiceCode', authenticateToken, checkRoleForPurchaseInvoiceMiddleware, purchaseInvoiceController.updateInvoice)
router.get('/', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.getAllInvoices)
router.get('/statistic-revenue-last-seven-days', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.statisticsRevenueLast7Days);
router.get('/statistic-revenue-last-four-weeks', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.statisticsRevenueLast4Weeks);
router.get('/statistic-revenue-last-four-months', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.statisticsRevenueLast4Months);
router.get('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.getInvoiceByCode)
router.delete('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.deleteInvoice)
router.put('/removing-items/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), purchaseInvoiceController.deleteItems)

module.exports = router;