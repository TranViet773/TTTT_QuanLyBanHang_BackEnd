const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucher.controller");
const {
    authenticateToken,
    checkRoleMiddleware,
} = require("../middlewares/auth.middleware");

router.post(
    "/",
    authenticateToken,
    checkRoleMiddleware(["admin", "manager", "staff"]),
    voucherController.createVoucher
);

router.get(
  "/statistics",
  authenticateToken,
  checkRoleMiddleware(["admin", "manager", "staff"]),
  voucherController.getTotalVoucher
);
router.get("/", authenticateToken, voucherController.getAllVoucher);
router.get("/:id", authenticateToken, voucherController.getVoucherById);
router.put(
    "/update/:id",
    authenticateToken,
    checkRoleMiddleware(["admin", "manager", "staff"]),
    voucherController.updateVoucher
);
router.put(
    "/:id",
    authenticateToken,
    checkRoleMiddleware(["admin", "manager", "staff"]),
    voucherController.deleteVoucher
);
router.put(
    "/restore/:id",
    authenticateToken,
    checkRoleMiddleware(["admin", "manager", "staff"]),
    voucherController.restoreVoucher
);
// router.get(
//   "/thongke/statistics",
//   authenticateToken,
//   checkRoleMiddleware(["admin", "manager", "staff"]),
//   voucherController.getTotalVoucher
// );

router.put("/add-item/voucher-code/:voucherCode", authenticateToken, checkRoleMiddleware(["admin", "manager", "staff"]), voucherController.addItemsForVoucher);
router.put("/remove-item/voucher-code/:voucherCode", authenticateToken, checkRoleMiddleware(["admin", "manager", "staff"]), voucherController.removeItemFromVoucher);
router.get("/:voucherCode/items", authenticateToken, checkRoleMiddleware(["admin", "manager", "staff"]), voucherController.getItemsFromVoucher);

module.exports = router;
