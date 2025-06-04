const accountService = require("../services/account.service");

const setSuspended = async (req, res) => {
  const { username, isSuspended } = req.body;

  try {
    const updatedAccount = await accountService.handleSetSuspended(
      username,
      isSuspended
    );
    return res.status(200).json({
      message: "Cập nhật trạng thái tài khoản thành công.",
      success: true,
      data: updatedAccount,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
      data: null,
    });
  }
};

const setActive = async (req, res) => {
  const { accountId, isActive } = req.body;

  try {
    const updatedAccount = await accountService.handleSetActive(
      accountId,
      isActive
    );
    return res.status(200).json({
      message: "Cập nhật trạng thái hoạt động tài khoản thành công.",
      success: true,
      data: updatedAccount,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
      data: null,
    });
  }
};
module.exports = {
  setSuspended,
  setActive,
};
