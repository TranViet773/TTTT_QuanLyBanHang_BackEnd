const userService = require('../services/user.service');

const updateUser  = async (req, res) => {
    try {
        const userId = req.user.USER_ID; // lấy từ middleware để xác thực 
         const data = req.body;
        const result = await userService.updateUser(userId, data);
        if (result.error) {
            return res.status(401).json({
                message: result.error,
                success: false,
                data: null
            });
        }
        res.status(200).json({
            message: "Cập nhật thông tin thành công",
            success: true,
            data: result
        });


    }
    catch (error) {
        console.error("Lỗi cập nhật thông tin người dùng:", error);
        res.status(500).json({
            message: "Lỗi cập nhật thông tin người dùng",
            success: false,
            data: null
        });
    }
};
module.exports = {
    updateUser 
};
