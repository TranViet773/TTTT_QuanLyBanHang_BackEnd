const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const {
    authenticateToken,
    checkRoleMiddleware,
} = require("../middlewares/auth.middleware");

router.post("/", authenticateToken, checkRoleMiddleware(["admin", "manager", "staff"]), voucherController.createVoucher);
router.get("/", authenticateToken, voucherController.getAllVoucher);
router.get('/:id', authenticateToken, voucherController.getVoucherById);
router.put('/:id', authenticateToken, checkRoleMiddleware(["admin", "manager", "staff"]), voucherController.updateVoucher);
router.delete('/:id', authenticateToken, checkRoleMiddleware(["admin", "manager", "staff"]), voucherController.deleteVoucher);
router.put('/restore/:id', authenticateToken, checkRoleMiddleware(["admin", "manager", "staff"]), voucherController.restoreVoucher);

module.exports = router;