const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken, refreshTokenMiddleware, checkRoleMiddleware } = require('../middlewares/auth.middleware');

// Post /api/auth/register
router.post('/register', authController.register)
router.post('/staffs', authenticateToken, checkRoleMiddleware(['admin']), authController.createStaffUser)
router.get('/verify-email', authController.verifyAndCreateUser)
router.post('/login', authController.login)
router.get('/current-user', authenticateToken, checkRoleMiddleware(['customer']),authController.getCurrentUser);
router.post('/refresh-token', refreshTokenMiddleware, authController.refreshToken);
router.post('/logout', authenticateToken, authController.logout);
router.put('/change-password', authenticateToken, authController.changePassword);
router.post('/forget-password', authController.sendForgetPasswordEmail)
router.post('/reset-password', authController.verifyAndResetPassword)
router.post('/google', authController.googleLogin);

module.exports = router;