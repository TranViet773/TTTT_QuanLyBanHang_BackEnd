const userService = require("../services/user.service");

const updateUser = async (req, res) => {
  try {
    const userId = req.user.USER_ID; // lấy từ middleware để xác thực
    const deviceId = req.user.DEVICE_ID; // lấy từ middleware để xác thực
    const data = req.body;
    const result = await userService.updateUser(userId, data, deviceId);
    if (result.error) {
      return res.status(401).json({
        message: result.error,
        success: false,
        data: null,
      });
    }
    res.status(200).json({
      message: "Cập nhật thông tin thành công",
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin người dùng:", error);
    res.status(500).json({
      message: "Lỗi cập nhật thông tin người dùng",
      success: false,
      data: null,
    });
  }
};

// // hàm này dùng để chuyển đổi giá trị từ chuỗi sang boolean
// const parseBoolean = (value) => {
//     if (value === "true") {
//         return true;
//     }
//     if (value === "false") {
//         return false;
//     }
//     return undefined;
// }

const getUsers = async (req, res) => {
    try {
        const { page, limit, role } = req.query;
        const result = await userService.getUsers({
          page,
          limit,
          role
        });
        res.status(200).json({
            message: "Lấy thông tin người dùng thành công",
            success: true,
            data: result
        });


    } catch (error) {
    console.error(error);
    res.status(500).json({
        message: "Lôi lấy thông tin người dùng",
        success: false,
        error: error.message
    })
}

};

const updateRoleForUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await userService.handleUpdateRoleForUser(userId, req.body);
        if (result.error) {
            return res.status(401).json({
                message: result.error,
                success: false,
                data: null
            });
        }
        res.status(200).json({
            message: "Cập nhật quyền người dùng thành công",
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Lỗi cập nhật quyền người dùng:", error);
        res.status(500).json({
            message: "Lỗi cập nhật quyền người dùng",
            success: false,
            data: null
        });
    }
}

const getUserById = async (req, res) => {
    try{
        const userId = req.params.userId;
        var result = await userService.handleGetUserById(userId);
        if (result.error) {
            return res.status(401).json({
                message: result.error,
                success: false,
                data: null
            });
        }
        res.status(200).json({
            message: "Lấy thông tin người dùng thành công!",
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Lấy thông tin người dùng thất bại:", error);
        res.status(500).json({
            message: "Lấy thông tin người dùng thất bại!",
            success: false,
            data: null
        });
    }
};

module.exports = {
    updateUser,
    getUsers,
    updateRoleForUser,
    getUserById
};
