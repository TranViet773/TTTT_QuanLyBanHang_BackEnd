const userService = require('../services/user.service');
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
                message: "Đã gưi mail xác thực tài khoản đến email của bạn",
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
}

module.exports = {
    register,
    verifyAndCreateUser,
    login
}