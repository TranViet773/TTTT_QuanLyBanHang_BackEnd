const jwt = require('jsonwebtoken');
const AccountDeviceModel = require('../models/AccountDevice.model');
const { compareSync } = require('bcryptjs');
const authHelper = require('../helpers/auth.helper');
const { isBlacklisted } = require('../utils/tokenBlacklist');


const authenticateToken = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  const deviceId = req.body.deviceId;
  const userId = req.body.userId;
  //const userId = req.user?.USER_ID || req.body.userId;

  if (!accessToken)
    return res.status(401).json({
      message: "Chưa đăng nhập",
      success: false,
      data: null
    });
    
    try {
        const isBlack = await isBlacklisted(accessToken);
        if (isBlack) {
            return res.status(403).json({
                message: "Token đã bị thu hồi",
                success: false,
                data: null
            });
        } 
        const {privateKey, publicKey, error} = await authHelper.getSecretKey(userId, deviceId);
        if(error) {
            return res.status(401).json({
                message: "Thiết bị không hợp lệ 1",
                success: false,
                data: null
            });
        }
        const decoded = jwt.verify(accessToken, publicKey); // Hoặc dùng key từ DB/device
        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(403).json({ error: "Token không hợp lệ" });
    }
};

const refreshTokenMiddleware = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  const deviceId = req.body.deviceId;
  const userId = req.body.userId;
  
  if (!refreshToken) {
    return res.status(400).json({ message: 'Chưa đăng nhập.' });
  }

  const isBlack = await isBlacklisted(refreshToken);
  if (isBlack) {
    return res.status(403).json({
      message: "Token đã bị thu hồi",
      success: false,
      data: null
    });
  }

  const { privateKey, publicKey } = await authHelper.getSecretKey(userId, deviceId);

  try {
    const decoded = jwt.verify(refreshToken, publicKey);
    req.user = req.user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Refresh token đã hết hạn' });
    }
    return res.status(403).json({ message: 'Refresh token không hợp lệ' });
  }
};

const checkRoleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Người dùng chưa đăng nhập' });
    }

    const roleMap = {
      admin: req.user.IS_ADMIN,
      manager: req.user.IS_MANAGER,
      staff: req.user.IS_SERVICE_STAFF,
      customer: req.user.IS_CUSTOMER,
    };

    const isAuthorized = allowedRoles.some(role => roleMap[role]);

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    next();
  };
};


module.exports = {
  authenticateToken,
  refreshTokenMiddleware,
  checkRoleMiddleware
};