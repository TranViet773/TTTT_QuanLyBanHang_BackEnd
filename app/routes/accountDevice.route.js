const express = require('express')
const router = express.Router()
const accountDeviceController = require('../controllers/accountDevice.controller')
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware')

router.get('/', authenticateToken, accountDeviceController.getAllDevice)
router.get('/:userId', authenticateToken, accountDeviceController.getAllDeviceByUserId)

module.exports = router