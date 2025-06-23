const express = require('express');
const router = express.Router();
const unitInvoiceController = require('../controllers/unitInvoice.controller')
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

router.get('/', unitInvoiceController.getAllUnitInvoice)
router.post('/', authenticateToken, checkRoleMiddleware(['admin', 'manager']), unitInvoiceController.createUnitInvoice)
router.put('/:id', authenticateToken, checkRoleMiddleware(['admin', 'manager']), unitInvoiceController.updateUnitInvoice)
router.delete('/:id', authenticateToken, checkRoleMiddleware(['admin', 'manager']), unitInvoiceController.deleteUnitInvoice)
router.get('/:id', unitInvoiceController.getUnitInvoiceById)

module.exports= router