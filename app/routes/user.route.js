const express = require('express');
const router = express.Router();
const { updateUser, getUsers, updateRoleForUser, getUserById } = require("../controllers/user.controller");
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

router.put ('/profile', authenticateToken, updateUser );
router.get('/', authenticateToken, getUsers);
router.put('/role/:userId', authenticateToken, checkRoleMiddleware(['admin']), updateRoleForUser);
router.get('/:userId', authenticateToken, getUserById);

module.exports = router;