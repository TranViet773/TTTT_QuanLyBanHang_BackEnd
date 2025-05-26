const express = require('express');
const router = express.Router();
const purchaseInvoiceController = require('../controllers/purchaseInvoice.controller');
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

// Post 
router.post('/', authenticateToken, purchaseInvoiceController.createInvoice)
router.put('/:invoiceCode', authenticateToken, purchaseInvoiceController.updateInvoiceStatus)
router.get('/', authenticateToken, purchaseInvoiceController.getAllInvoices)
router.get('/:invoiceCode', authenticateToken, purchaseInvoiceController.getInvoiceByCode)

module.exports = router;