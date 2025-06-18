const userService = require('../services/user.service');
const authService = require('../services/auth.service');
const User = require('../models/User.model')
const Account = require("../models/Account.model")
const jwt = require('jsonwebtoken');
const ms = require('ms')

const register = async (req, res) => {
    try{
        
        const data = req.body

        data.isAdmin = false
        data.isManager = false,
        data.isServiceStaff = false
        data.createByUserID = null

        const response = await userService.handleRegistration(data);

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
    return res.redirect('http://localhost:5173/login/')
  } catch (error) {
    return res.status(400).json(
      { 
        success: false, 
        message: 'Lỗi khi xác thực email!',
        data: error.message
      });
  }
};

const createStaffUser = async (req, res) => {
    let user = null

    try {
        const data = req.body
        data.createByUserId = req.user.USER_ID

        const existingUser =
            (await User.findOne({ "LIST_EMAIL.EMAIL": data.email })) ||
            (await Account.findOne({ USERNAME: data.username }));
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email hoặc username đã được đăng ký!",
                data: null
            })
        }

        user = await userService.handleCreateUser(data)

        if (user?.error) {
            return res.status(400).json({
                success: false,
                message: user.error,
                data: null
            })
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
            data: null
        })
    }

    if (user) {
        try {
            await authService.mailToStaffUser(user)

            return res.status(201).json({
                success: true,
                message: 'Tạo tài khoản thành công.',
                data: null
            })

        } catch (error) {

            await userService.rollbackCreatingStaffUser(user._id)

            return res.status(500).json({
                success: false,
                message: error.message,
                data: null
            })
        }
    } else {
        return res.status(500).json({
            success: false,
            message: "Lỗi khi tạo tài khoản.",
            data: null
        })
    }
}

const login = async (req, res) => {
    try {
        const response = await userService.login(req.body)
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
                sameSite: 'Lax', // hoặc 'Lax' nếu muốn linh hoạt hơn
                maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY) // 15 phút
            });

            res.cookie('refreshToken', response.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY) // 7 ngày
            });
            res.status(201).json({
                success: true,
                message: 'Login successfully',
                data: response.user_data
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
        const userId = req.body.userId;
        const deviceId = req.body.deviceId;
        const response = await userService.handleRefreshToken(userId, deviceId);
        // console.log("Response: ", response.newAccessToken)
        if(!response.error) {
            res.cookie('accessToken', response.newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000 // thời gian sống của key trong cookie
            });
            return res.status(200).json({
                message: 'Refresh token thành công',
                success: true,
                data: response,
            }); 
        }else{
            return res.status(400).json({
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
        req.session.destroy();
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

const changePassword = async (req, res)=>{

    try {
        const userId = req.user.USER_ID;
        const {oldPassword, newPassword} = req.body;
       
        const result = await authService.changePassword(userId, oldPassword, newPassword);
        if (oldPassword === newPassword) {
            return res.status(409).json({
                message: "Mật khẩu mới không được giống mật khẩu cũ",
                success: false,
                data: null
            });
        }
        if (result.error) {
            return res.status(401).json({
                message: result.error,
                success: false,
                data: null
            });
        }
        return res.status(200).json({
            message: "Đổi mật khẩu thành công",
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



};

const sendForgetPasswordEmail = async (req, res) => {
    try {
        const response = await userService.handleForgetPassword(req.body)
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

const verifyAndResetPassword = async (req, res) => {
    try {
        const token = req.body.token
        const data = jwt.verify(token, process.env.EMAIL_SECRET_KEY)
        data.newPassword = req.body.newPassword
        console.log(data)

        const response = await userService.resetPassword(data)
        
        if (response?.error) {
            return res.status(500).json({
                message: response.error,
                success: false,
                data: null
            })
        }

        return res.status(200).json({
            message: "Đặt lại mật khẩu thành công.",
            success: true,
            data: null
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null
        })
    }
};

const googleLogin = async (req, res) => {
    const {token, deviceId} = req.body;
    //console.log(req.body);
    try{
        const response = await userService.handleGoogleLogin(token, deviceId);
        console.log("response: ", response);
        if(response.error){
            return res.status(500).json({
                message: response.error,
                success: false,
                data: null
            })
        }else{
            res.cookie('accessToken', response.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // chỉ gửi qua HTTPS
                sameSite: 'Lax', // hoặc 'Lax' nếu muốn linh hoạt hơn
                maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY) // 15 phút
            });

            res.cookie('refreshToken', response.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY) // 7 ngày
            });
            res.status(201).json({
                success: true,
                message: 'Login successfully',
                data: response.user_data
            })
        }
    }catch(e){
        return res.status(500).json({
            message: e.message,
            success: false,
            data: null
        });
    }
}

const verifyAccount = async (req, res) => {
    try{
        const {USER_ID, DEVICE_ID} = req.user;
        const response = await authService.handleVerifyAccount(USER_ID, DEVICE_ID);
        if(response.error){
            res.status(500).json({
                message: `Có lỗi khi xác thực: ${response.error}`,
                success: false,
                data: null
            });
        }
        return res.status(200).json({
            message: "Xác thực thành công!",
            success: true,
            data: response
        })
    }catch(e)
    {
       console.log("Có lỗi khi xác thực!");
       return res.status(500).json({
         message: `Có lỗi khi xác thực: ${e}`,
         success: false,
         data: null
       }); 
    }
}

module.exports = {
    register,
    verifyAndCreateUser,
    login,
    sendForgetPasswordEmail,
    verifyAndResetPassword,
    getCurrentUser,
    logout,
    refreshToken,
    createStaffUser,
    changePassword,
    googleLogin,
    verifyAccount
}