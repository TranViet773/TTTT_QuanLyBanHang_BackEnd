const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Post /api/auth/register
router.post('/register', authController.register);
router.get('/verify-email', authController.verifyAndCreateUser);
router.post('/login', authController.login)

module.exports = router;    