const express = require('express');
const router = express.Router();
const unitInvoiceController = require('../controllers/unitInvoice.controller')
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

router.get('/', unitInvoiceController.getAllUnitInvoice)
router.post('/', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), unitInvoiceController.createUnitInvoice)
router.put('/', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), unitInvoiceController.updateUnitInvoice)
router.delete('/', authenticateToken, checkRoleMiddleware(['admin', 'manager', 'staff']), unitInvoiceController.deleteUnitInvoice)

module.exports= router