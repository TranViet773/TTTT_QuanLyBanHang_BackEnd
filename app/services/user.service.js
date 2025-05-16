const User = require('../models/User.model');
const Account = require('../models/Account.model');
const AccountDevice = require('../models/AccountDevice.model');
const authService = require('../services/auth.service');
const authHelper = require('../helpers/auth.helper')
const { generateKeyPairSync } = require('crypto');
const crypto = require('crypto');
const { devNull } = require('os');

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

const register = async (data) => {
  const {privateKey, publicKey} = generateKeyPair();
  const {username, password, lastName, firstName, gender, avatar, email} = data;
  const existingUser = await User.findOne({EMAIL: email}) || await Account.findOne({USERNAME: username});
  if (existingUser) throw new Error('Tài khoản đã tồn tại');
  //Tạo một đối tượng user
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
    BIRTH_DATE: new Date('2000-01-01'),
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
            THRU_DATE: '2030-01-01',
        }
    ]
  };

  let user = new User();
  try{
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
    const accountDeviceData = {
        USER_ID: user._id,  
        LIST_DEVICE_OF_ACCOUNT: [
            {
                PRIVATE_KEY: privateKey,
                PUBLIC_KEY: publicKey,
            }
        ]
    };

    const accountDevice = await AccountDevice.create(accountDeviceData);
    const verifyData = {
        USER_ID: user._id,
        USERNAME: accountData.USERNAME,
        FIRST_NAME: user.LIST_NAME[user.LIST_NAME.length-1].FIRST_NAME,
        LAST_NAME: user.LIST_NAME[user.LIST_NAME.length-1].LAST_NAME,
        EMAIL: user.LIST_EMAIL[user.LIST_EMAIL.length-1].EMAIL,
        DEVICE_ID: user._id,
        DEVICE_NAME: 'Device 1',
        IS_ADMIN: user.ROLE.IS_ADMIN,
        IS_MANAGER: user.ROLE.IS_MANAGER,
        IS_SERVICE_STAFF: user.ROLE.IS_SERVICE_STAFF,
        IS_CUSTOMER: user.ROLE.IS_CUSTOMER,
        IS_ACTIVE: account.IS_ACTIVE,
        AVATAR: user.AVATAR_IMG_URL
    }
    const accessToken = authService.generateAccessToken(verifyData, privateKey);
    const refreshToken = authService.generateRefreshToken(verifyData, privateKey);
     return {
        message: 'Đăng ký thành công',
        accessToken,
        refreshToken,
    };
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
    throw new Error('Đăng ký không thành công');
    
  }

};


// Kiểm tra thiết bị đăng nhập
const loginDevice = async (accountDevice, deviceId) => {
    console.log("Device: ", deviceId)
    // Kiểm tra thiết bị đăng nhập
    for (let i = 0; i <= accountDevice.LIST_DEVICE_OF_ACCOUNT.length - 1; i++) {
        // Nếu thiết bị đã được lưu
        if (accountDevice.LIST_DEVICE_OF_ACCOUNT[i].ID_DEVICE === deviceId) {
            return accountDevice.LIST_DEVICE_OF_ACCOUNT[i]
        }
    }

    // Nếu là thiết bị mới
    const {privateKey, publicKey} = generateKeyPair()
    accountDevice.LIST_DEVICE_OF_ACCOUNT.push({
        ID_DEVICE: deviceId || null,
        PRIVATE_KEY: privateKey,
        PUBLIC_KEY: publicKey
    })

    console.log(accountDevice)
    try {
        await accountDevice.save()
    } catch (error) {
        throw new Error("Lỗi khi lưu thiết bị mới")
    }

    return {
        PRIVATE_KEY: privateKey,
        PUBLIC_KEY: publicKey
    }
}

const login = async (data) => {
    const {username, email, password, deviceId} = data 
    const user = await User.findOne({ "LIST_EMAIL.EMAIL" : email})

    if ((!username || !email) && !password) {
        return {error: "Vui lòng nhập đầy đủ thông tin đăng nhập."}
    }
    
    // Nếu user đăng nhập bằng email
    if (user) {

        if (! authHelper.isValidEmail(user, email)) {
            return {error: "Email đã được thay đổi. Vui lòng nhập email bạn đang dùng để đăng ký."}
        }
        
        // Lấy account theo user id
        const account = await Account.findOne({ USER_ID: user._id })
        if (!account) {
            throw new Error('Lỗi xảy ra khi truy xuất tài khoản.')
        }

        // So sánh password
        if (! await authService.isMatchedPassword(password, account.PASSWORD)) {
            return {error: "Sai mật khẩu."}
        }

        const accountDevice = await AccountDevice.findOne({ USER_ID: user._id })
        if (!accountDevice) {
            throw new Error('Lỗi xảy ra khi truy xuất tài khoản.')
        }

        const device = await loginDevice(accountDevice, deviceId)

        // Lấy dữ liệu cho token
        const verifyData = {
            USER_ID: user._id,
            USERNAME: account.USERNAME,
            FIRST_NAME: user.LIST_NAME[user.LIST_NAME.length-1].FIRST_NAME,
            LAST_NAME: user.LIST_NAME[user.LIST_NAME.length-1].LAST_NAME,
            EMAIL: user.LIST_EMAIL[user.LIST_EMAIL.length-1].EMAIL,
            DEVICE_ID: device.ID_DEVICE || null,
            DEVICE_NAME: device.NAME_DEVICE || '',
            IS_ADMIN: user.ROLE.IS_ADMIN,
            IS_MANAGER: user.ROLE.IS_MANAGER,
            IS_SERVICE_STAFF: user.ROLE.IS_SERVICE_STAFF,
            IS_CUSTOMER: user.ROLE.IS_CUSTOMER,
            IS_ACTIVE: account.IS_ACTIVE,
            AVATAR: user.AVATAR_IMG_URL
        }

        console.log("Test verify device data: ", device)

        const accessToken = authService.generateAccessToken(verifyData, device.PRIVATE_KEY);
        const refreshToken = authService.generateRefreshToken(verifyData, device.PRIVATE_KEY);

        return {
            accessToken,
            refreshToken
        }
    }

    // Đăng nhập bằng username
    else {
        const account = await Account.findOne({USERNAME: username})
        if (!account) {
            return {error: "Tài khoản không tồn tại."}
        }      

        else {
            if (! await authService.isMatchedPassword(password, account.PASSWORD)) {
                return {error: "Sai mật khẩu."}
            }

            const user = await User.findOne({ _id: account.USER_ID })
            if (!user) {
                throw new Error('Lỗi xảy ra khi truy xuất thông tin user.')
            }

            const accountDevice = await AccountDevice.findOne({ USER_ID: user._id })
            if (!accountDevice) {
                throw new Error('Lỗi xảy ra khi truy xuất tài khoản.')
            }

            const device = await loginDevice(accountDevice, deviceId)

            const verifyData = {
                USER_ID: user._id,
                USERNAME: account.USERNAME,
                FIRST_NAME: user.LIST_NAME[user.LIST_NAME.length-1].FIRST_NAME,
                LAST_NAME: user.LIST_NAME[user.LIST_NAME.length-1].LAST_NAME,
                EMAIL: user.LIST_EMAIL[user.LIST_EMAIL.length-1].EMAIL,
                DEVICE_ID: device.ID_DEVICE,
                DEVICE_NAME: device.NAME_DEVICE || '',
                IS_ADMIN: user.ROLE.IS_ADMIN,
                IS_MANAGER: user.ROLE.IS_MANAGER,
                IS_SERVICE_STAFF: user.ROLE.IS_SERVICE_STAFF,
                IS_CUSTOMER: user.ROLE.IS_CUSTOMER,
                IS_ACTIVE: account.IS_ACTIVE,
                AVATAR: user.AVATAR_IMG_URL
            }
            console.log("Test verify device data: ", device)
            const accessToken = authService.generateAccessToken(verifyData, device.PRIVATE_KEY);
            const refreshToken = authService.generateRefreshToken(verifyData, device.PRIVATE_KEY);

            return {
                accessToken,
                refreshToken
            }
        }
    }

}


module.exports = {
    register,
    login,
}