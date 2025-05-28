const express = require('express');
const router = express.Router();

const accountController = require('../controllers/account.controller');
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

router.put('/suspended', authenticateToken, accountController.setSuspended); // Cần thêm kiểm tra role Admin checkRoleMiddleware(['admin']),
router.put('/active', authenticateToken, accountController.setActive);

module.exports = router;