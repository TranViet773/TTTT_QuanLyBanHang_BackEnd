const express = require('express');
const router = express.Router();
const { updateUser  } = require('../controllers/user.controller');
const { authenticateToken, autoRefreshTokenMiddleware, checkRoleMiddleware } = require('../middlewares/auth.middleware');

router.put ('/profile', authenticateToken, updateUser );
module.exports = router;