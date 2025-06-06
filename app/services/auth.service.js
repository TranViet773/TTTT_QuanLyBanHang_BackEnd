const User = require("../models/User.model");
const Account = require("../models/Account.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mailerHelper = require("../helpers/mailer.helper");
const fs = require("fs");
const path = require("path");
const { OAuth2Client } = require("google-auth-library");
const clientId = process.env.GG_CLIENT_ID;
const client = new OAuth2Client(clientId);
const authHelper = require("../helpers/auth.helper");
const userService = require("../services/user.service");
const { error } = require("console");
const AccountDeviceModel = require("../models/AccountDevice.model");

const generateAccessToken = (user, privateKey) => {
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
      AVATAR: user.AVATAR,
    },
    privateKey, // Dùng privateKey để ký
    { algorithm: "RS256", expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user, privateKey) => {
  return jwt.sign(
    { userId: user._id },
    privateKey, //Dùng privateKey để ký
    { algorithm: "RS256", expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

//Gửi mail xác thực
async function sendVerificationEmail(data) {
  const templatePath = path.join(
    __dirname,
    "..",
    "helpers",
    "templates",
    "verifyEmailTemplate.html"
  );
  let html = fs.readFileSync(templatePath, "utf8");

  // data là thông tin người dùng, Gửi qua đây để ký và token và truyền qua api.
  const tokenVerifyEmail = jwt.sign(data, process.env.EMAIL_SECRET_KEY, {expiresIn: process.env.EMAIL_TOKEN_EXPIRY});
  const verificationUrl = `http://localhost:${process.env.PORT}/api/auth/verify-email?token=${tokenVerifyEmail}`;

  // Thay thế các biến trong template
  html = html.replace(/{{userId}}/g, data.firstName);
  html = html.replace(/{{verificationUrl}}/g, verificationUrl);
  try {
    await mailerHelper.transporter.sendMail({
      from: `"Hệ thống quản lý doanh nghiệp" <${process.env.EMAIL}>`,
      to: data.email,
      subject: "Xác thực tài khoản",
      html: html,
    });
  } catch (error) {
    console.error("Lỗi gửi email xác thực:", error);
    return { error: "Lỗi gửi email xác thực" };
  }
};

async function sendResetPasswordEmail(data) {
  const templatePath = path.join(
    __dirname,
    "..",
    "helpers",
    "templates",
    "forgetPasswordTemplate.html"
  );
  let html = fs.readFileSync(templatePath, "utf8");

  // data là thông tin người dùng, Gửi qua đây để ký và token và truyền qua api.
  const tokenVerifyEmail = jwt.sign(data, process.env.EMAIL_SECRET_KEY, {expiresIn: process.env.EMAIL_TOKEN_EXPIRY});
  const verificationUrl = `http://localhost:5173/resetPassword?token=${tokenVerifyEmail}`;

  // Thay thế các biến trong template
  html = html.replace(/{{userId}}/g, data.firstName);
  html = html.replace(/{{verificationUrl}}/g, verificationUrl);
  try {
    await mailerHelper.transporter.sendMail({
      from: `"Hệ thống quản lý doanh nghiệp" <${process.env.EMAIL}>`,
      to: data.email,
      subject: "Quên mật khẩu tài khoản",
      html: html,
    });
  } catch (error) {
    console.error("Lỗi gửi email xác thực quên mật khẩu:", error);
    return { error: "Lỗi gửi email xác thực quên mật khẩu." };
  }
};

const mailToStaffUser = async (data) => {

    const templatePath = path.join(__dirname, '..', 'helpers', 'templates', 'welcomeStaffTemplate.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    // Thay thế các biến trong template
    html = html.replace(/{{username}}/g, data.username);
    html = html.replace(/{{password}}/g, data.password); 
    try {
        await mailerHelper.transporter.sendMail({
          from: `"Hệ thống quản lý doanh nghiệp" <${process.env.EMAIL}>`, 
          to: data.email,
          subject: 'Cấp tài khoản nội bộ',
          html: html
        });
    } catch (error) {
        console.error('Lỗi gửi email cấp tài khoản:', error);
        throw new Error('Lỗi gửi email cấp tài khoản')
    }

}

// Kiểm tra password
const isMatchedPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// đổi mật khẩu
const changePassword = async (userId, oldPassword, newPassword) => {
  const account = await Account.findOne({ USER_ID: userId });
  if (!account) {
    return { error: "Tài khoản không tồn tại" };
  }
  const isMatched = await bcrypt.compare(oldPassword, account.PASSWORD);
  if (!isMatched) {
    return { error: "Mật khẩu cũ không đúng" };
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  account.PASSWORD = hashedPassword;
  try {
    await account.save();
    return {
      success: true,
      message: "Đổi mật khẩu thành công",
    };

  } catch (error) {
    return {
      error: "Lỗi khi đổi mật khẩu",
    };
  }
};

const verifyTokenOAuth2 = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId
  });

  const payload = ticket.getPayload();
  return payload;
}

const handleVerifyAccount = async (userId, deviceId) => {
    try{
      const user = await User.findById(userId);
      if(!user) return {error: "Người dùng không còn tồn tại!"};
      
      const account = await Account.findOne({USER_ID: userId});
      if(!account) return {error: "Tài khoản không còn tồn tại!"};

      const email = authHelper.isValidInfo(user.LIST_EMAIL);
      const name = authHelper.isValidInfo(user.LIST_NAME);
      const address = authHelper.isValidInfo(user.LIST_ADDRESS);
      const phoneNumber = authHelper.isValidInfo(user.LIST_PHONE_NUMBER);
      
      return {
        USER_ID: user._id,
        USERNAME: account.USERNAME,
        NAME: {
          LAST_NAME: name.LAST_NAME,
          FIRST_NAME: name.FIRST_NAME,
          MIDDLE_NAME: name.MIDDLE_NAME,
          FULL_NAME: name.FULL_NAME,
        },
        CURRENT_GENDER: user.CURRENT_GENDER,
        BIRTH_DATE: user.BIRTH_DATE,
        AVATAR_IMG_URL: user.AVATAR_IMG_URL,
        ADDRESS: {
          COUNTRY: address?.COUNTRY,
          CITY: address?.CITY,
          DISTRICT: address?.DISTRICT,
          WARD: address?.WARD,
          ADDRESS_1: address?.ADDRESS_1,
          ADDRESS_2: address?.ADDRESS_2,
          STATE: address?.STATE,
        },
        ROLE: {
          IS_ADMIN: user.ROLE.IS_ADMIN,
          IS_MANAGER: user.ROLE.IS_MANAGER,
          IS_SERVICE_STAFF: user.ROLE.IS_SERVICE_STAFF,
          IS_CUSTOMER: user.ROLE.IS_CUSTOMER,
          IS_ACTIVE: account.IS_ACTIVE,
        },
        EMAIL: email.EMAIL,
        PHONE_NUMBER: {
          COUNTRY_CODE: phoneNumber?.COUNTRY_CODE,
          COUNTRY_NAME: phoneNumber?.COUNTRY_NAME,
          AREA_CODE: phoneNumber?.AREA_CODE,
          PHONE_NUMBER: phoneNumber?.PHONE_NUMBER,
          FULL_PHONE_NUMBER: phoneNumber?.FULL_PHONE_NUMBER,
        },
        GOOGLE_SUB_ID: user.GOOGLE_SUB_ID,
      }
    }catch(e){
      return {error: e};
    }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  isMatchedPassword,
  sendVerificationEmail,
  sendResetPasswordEmail,
  mailToStaffUser,
  changePassword,
  verifyTokenOAuth2,
  handleVerifyAccount
};