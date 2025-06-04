const accountService = require("../services/account.service");

const setSuspended = async (req, res) => {
    const { username, isSuspended, banReason } = req.body;

    try {
        const response = await accountService.handleSetSuspended(username, isSuspended);

        if (response?.error) {
            return res.status(400).json({
                message: response.error,
                success: false,
                data: null
            })
        } 
        
        
        if (isSuspended == true) {
            await accountService.sendBanNotificationEmail(banReason, response.email.EMAIL, username)
        }

        return res.status(200).json({
            message: "Cập nhật trạng thái tài khoản thành công.",
            success: true,
            data: response.safeUser
        });
    } catch (error) {
        await accountService.handleSetSuspended(username, !isSuspended)

        return res.status(500).json({
            message: error.message,
            success: false,
            data: null
        });
    }
};

const setActive = async (req, res) => {
    const { username, isActive, banReason } = req.body;

    console.log(req.body)

    try {
        const response = await accountService.handleSetActive(username, isActive);

        if (response?.error) {
            return res.status(400).json({
                message: response.error,
                success: false,
                data: null
            })
        } 
        
        if (isActive == false) {
            await accountService.sendBanNotificationEmail(banReason, response.email.EMAIL, username)
        }

        return res.status(200).json({
            message: "Cập nhật trạng thái hoạt động tài khoản thành công.",
            success: true,
            data: response.safeUser
        });
    } catch (error) {
        await accountService.handleSetActive(username, !isActive)

        return res.status(500).json({
            message: error.message,
            success: false,
            data: null
        });
    }
};


module.exports = {
  setSuspended,
  setActive,
};
