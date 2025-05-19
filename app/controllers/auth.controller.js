const userService = require('../services/User.service');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try{
        const response = await userService.handleRegistration(req.body);
        if(response?.error) {
            return res.status(409).json({
                message: response.error,
                success: false,
                data: null,
            });
        }else{
          return res.status(200).json({
                message: "Đã gửi mail xác thực tài khoản đến email của bạn",
                success: true,
                data: null,
            });
        }
    } catch (error) {
        return res.status(500).json({
                message: error.message,
                success: false,
                data: null,
            });
    }
};

const verifyAndCreateUser = async (req, res) => {
  try {
    const token = req.query.token;
    const data = jwt.verify(token, process.env.EMAIL_SECRET_KEY);
    console.log(data);
    await userService.handleCreateUser(data);
    return res.status(200).json(
      { 
        success: true, 
        message: 'Xác thực email thành công!',
        data: null
      });
  } catch (error) {
    return res.status(400).json(
      { 
        success: false, 
        message: 'Lỗi khi xác thực email!',
        data: error.message
      });
  }
};


const login = async (req, res) => {
    try {
        const response = await userService.login(req.body)
        console.log("Response: ", response)

        if(response.error) {
            res.status(401).json({
                success: false,
                message: response.error,
                data: null
            })
        }

        else {
            res.cookie('accessToken', response.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // chỉ gửi qua HTTPS
                sameSite: 'Strict', // hoặc 'Lax' nếu muốn linh hoạt hơn
                maxAge: 15 * 60 * 1000 // 15 phút
            });

            res.cookie('refreshToken', response.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
            });
            res.status(201).json({
                success: true,
                message: 'Login successfully',
                data: response
            })
        }
        
    } catch (err) {
        
        res.status(500).json({
            success: false,
            message: err.message,
            data: null
        })
    }
};

const getCurrentUser = async (req, res) => {
     try {
        const userData = req.user;
        res.status(200).json({
            success: true,
            message: 'Lấy thông tin người dùng thành công',
            data: userData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin người dùng',
            data: null
        });
    }
};

const refreshToken = async (req, res) => {
    try{
        const response = await userService.handleRefreshToken(req.user);
        // console.log("Response: ", response.newAccessToken)
        if(!response.error) {
            res.cookie('accessToken', response.newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: 15 * 60 * 1000 // thời gian sống của key trong cookie
            });
            return res.status(200).json({
                message: 'Refresh token thành công',
                success: true,
                data: response,
            }); 
        }else{
            return res.status(401).json({
                message: response.error,
                success: false,
                data: null,
            });
        }
        
    }catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null,
        });
    }
};

const logout = async (req, res) => {
    try {
        // Xử lý lưu lào blacklist trước khi clear
        const response = await userService.handleLogout(req.user, req.cookies.accessToken, req.cookies.refreshToken);
        //Clear khỏi cookie
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.status(200).json({
            message: 'Đăng xuất thành công',
            success: true,
            data: null
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null
        });
    }
}

<<<<<<< HEAD
const forgetPassword = async (req, res) => {
    try {
        const response = await userService.handleForgotPassword(req.body)
            if(response?.error) {
                return res.status(409).json({
                    message: response.error,
                    success: false,
                    data: null,
                });
            }else{
            return res.status(200).json({
                    message: "Đã gửi mail xác thực tài khoản đến email của bạn",
                    success: true,
                    data: null,
                });
            }
        } catch (error) {
            return res.status(500).json({
                    message: error.message,
                    success: false,
                    data: null,
                });
        }
}
=======
>>>>>>> f821359ed1b3dca54cb38b37f430c801e8b63b1c

module.exports = {
    register,
    verifyAndCreateUser,
    login,
<<<<<<< HEAD
    forgetPassword,
=======
    getCurrentUser,
    refreshToken,
    logout
>>>>>>> f821359ed1b3dca54cb38b37f430c801e8b63b1c
}