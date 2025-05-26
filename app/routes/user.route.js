const express = require('express');
const router = express.Router();
const { updateUser, getUsers } = require("../controllers/user.controller");
const { authenticateToken, refreshTokenMiddleware, checkRoleMiddleware } = require('../middlewares/auth.middleware');

router.put ('/profile', authenticateToken, updateUser );
router.get('/', authenticateToken, getUsers);
module.exports = router;