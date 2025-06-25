const express = require('express');
const router = express.Router();
const unitInvoiceController = require('../controllers/unitInvoice.controller')
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

router.get('/', unitInvoiceController.getAllUnitInvoice)
router.post('/', authenticateToken, checkRoleMiddleware(['admin']), unitInvoiceController.createUnitInvoice)
router.put('/:id', authenticateToken, checkRoleMiddleware(['admin']), unitInvoiceController.updateUnitInvoice)
router.delete('/:id', authenticateToken, checkRoleMiddleware(['admin']), unitInvoiceController.deleteUnitInvoice)
router.get('/:id', unitInvoiceController.getUnitInvoiceById)

module.exports= router