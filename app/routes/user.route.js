const express = require("express");
const router = express.Router();
const { updateUser, getUsers, updateRoleForUser, getUserById } = require("../controllers/user.controller");
const { authenticateToken, checkRoleMiddleware } = require('../middlewares/auth.middleware');

router.put ('/profile', authenticateToken, updateUser );
router.get("/", authenticateToken, checkRoleMiddleware(["admin"]), getUsers);
router.put('/role/:userId', authenticateToken, checkRoleMiddleware(['admin']), updateRoleForUser);
router.get('/:userId', authenticateToken, checkRoleMiddleware(["admin"]), getUserById);

module.exports = router;
