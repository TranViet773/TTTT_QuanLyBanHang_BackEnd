const User = require('../models/User.model');
const Account = require('../models/Account.model');
const AccountDevice = require('../models/AccountDevice.model');
const authService = require('../services/auth.service');
const { generateKeyPairSync } = require('crypto');
const crypto = require('crypto');
const { error } = require('console');

const generateKeyPair = () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem'
    }
  });
  return { privateKey, publicKey };
};

const handleRegistration = async (data) => {
  const existingUser = await User.findOne({EMAIL: data.email}) || await Account.findOne({USERNAME: data.username});
  if (existingUser) return { error: 'Email đã được đăng ký!' };
  await authService.sendVerificationEmail(data);
}

const handleCreateUser = async (data) => {
  const {username, password, lastName, firstName, gender, avatar, email, dob} = data;
  
  const userData = {
    LIST_NAME: [
        {
            LAST_NAME: lastName,
            FIRST_NAME: firstName,
            MIDDLE_NAME: '',
            FULL_NAME: `${lastName} ${firstName}`,
            FROM_DATE: new Date(),
            THRU_DATE: null,
        }
    ],
    CURRENT_GENDER: gender, // 'Nam', 'Nữ', 'Khác'
    BIRTH_DATE: dob === null ? null : new Date(dob),
    AVATAR_IMG_URL: avatar || '',
    ROLE: {
        IS_ADMIN: false,
        IS_MANAGER: true,
        IS_SERVICE_STAFF: false,
        IS_CUSTOMER: true,
    },
    LIST_EMAIL: [
        {
            EMAIL: email,
            FROM_DATE: new Date(),
            THRU_DATE: null,
        }
    ]
  };

  let user = new User();
  try{
    //Tạo một đối tượng user
    user = await User.create(userData);
    console.log(user);

    //Tạo đối tượng Account
    const accountData = {
        USERNAME: username,
        PASSWORD: await authService.hashPassword(password),
        FROM_DATE: new Date(),
        THRU_DATE: null,
        USER_ID: user._id,
    };
    const account = await Account.create(accountData);

    // const verifyData = {
    //     USER_ID: user._id,
    //     USERNAME: accountData.USERNAME,
    //     FIRST_NAME: user.LIST_NAME[user.LIST_NAME.length-1].FIRST_NAME,
    //     LAST_NAME: user.LIST_NAME[user.LIST_NAME.length-1].LAST_NAME,
    //     EMAIL: user.LIST_EMAIL[user.LIST_EMAIL.length-1].EMAIL,
    //     IS_ADMIN: user.ROLE.IS_ADMIN,
    //     IS_MANAGER: user.ROLE.IS_MANAGER,
    //     IS_SERVICE_STAFF: user.ROLE.IS_SERVICE_STAFF,
    //     IS_CUSTOMER: user.ROLE.IS_CUSTOMER,
    //     IS_ACTIVE: account.IS_ACTIVE,
    //     AVATAR: user.AVATAR_IMG_URL
    // }
    //const accessToken = authService.generateAccessToken(verifyData, privateKey);
    //const refreshToken = authService.generateRefreshToken(verifyData, privateKey);
  }catch (error) {
    //Rollback khi có lỗi
    const userExisted = await User.findOne({_id: user._id});
    if(userExisted) {
      await User.deleteOne({_id: user._id});
    }

    const accountExisted = await Account.findOne({USER_ID: user._id});
    if(accountExisted) {
      await Account.deleteOne({USER_ID: user._id});
    }

    const accountDeviceExisted = await AccountDevice.findOne({USER_ID: user._id});
    if(accountDeviceExisted) {
      await AccountDevice.deleteOne({USER_ID: user._id});
    }

    console.error('Error creating user:', error);
    return { error: 'Lỗi khi tạo tài khoản' };
  }

};

module.exports = {
    handleCreateUser,
    handleRegistration
}