const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateAccessToken = (user, publicKey) => {
  return jwt.sign(
    { 
      USER_ID: user.USER_ID,
      USERNAME: user.USERNAME,
      FIRST_NAME: user.FIRST_NAME,
      LAST_NAME: user.LAST_NAME,
      EMAIL: user.EMAIL,
      DEVICE_ID: user.DEVICE_ID,
      DEVICE_NAME: user.DEVICE_NAME,
      IS_ADMIN: user.IS_ADMIN,
      IS_MANAGER: user.IS_MANAGER,
      IS_SERVICE_STAFF: user.IS_SERVICE_STAFF,
      IS_CUSTOMER: user.IS_CUSTOMER,
      IS_ACTIVE: user.IS_ACTIVE,
      AVATAR: user.AVATAR
    },
    publicKey, // Dùng privateKey để ký
    { algorithm: 'RS256', expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user, privateKey) => {
  return jwt.sign(
    { userId: user._id },
    privateKey, //Dùng privateKey để ký
    { algorithm: 'RS256', expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

//Hashpassword
const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword; 
};


// Kiểm tra password
const isMatchedPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword)
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  isMatchedPassword,
};
