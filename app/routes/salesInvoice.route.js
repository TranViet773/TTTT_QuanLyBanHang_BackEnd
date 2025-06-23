const express = require('express');
const router = express.Router();
const salesInvoiceController = require('../controllers/salesInvoice.controller');
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');
const { checkRoleForCreatingMiddleware } = require('../middlewares/invoices.middleware')

// Post 
router.post('/', authenticateToken, checkRoleForCreatingMiddleware, salesInvoiceController.createInvoice)
router.put('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.updateInvoice)
router.put('/removing-items/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.deleteItems)
router.put('/cancelling-order/:invoiceCode', authenticateToken, salesInvoiceController.cancelOrder)
router.get('/', authenticateToken, salesInvoiceController.getAllInvoices)
router.get('/statistic-based-on-status', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.statisticInvoiceBasedOnStatus)
router.get('/statistic-revenue-last-seven-days', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.statisticsRevenueLast7Days);
router.get('/statistic-revenue-last-four-weeks', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.statisticsRevenueLast4Weeks);
router.get('/statistic-revenue-last-four-months', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.statisticsRevenueLast4Months);
router.get('/:invoiceCode', authenticateToken, salesInvoiceController.getInvoiceByCode)
router.delete('/:invoiceCode', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), salesInvoiceController.deleteInvoice)

module.exports = router;