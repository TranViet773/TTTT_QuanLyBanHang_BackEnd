const User = require('../models/User.model');
const Account = require('../models/Account.model');
const AccountDevice = require('../models/AccountDevice.model');
const authService = require('../services/auth.service');
const authHelper = require('../helpers/auth.helper')
const { generateKeyPairSync } = require('crypto');
const ms = require('ms');

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

const handleUserDataForResponse = (user, account, device) => {
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
        AVATAR: user.AVATAR_IMG_URL,
        DEVICE_ID: device.ID_DEVICE || null,
    }

    const accessToken = authService.generateAccessToken(verifyData, device.PRIVATE_KEY);
    const refreshToken = authService.generateRefreshToken(verifyData, device.PRIVATE_KEY);

    const email = authHelper.isValidInfo(user.LIST_EMAIL)
    const name = authHelper.isValidInfo(user.LIST_NAME)
    const address = authHelper.isValidInfo(user.LIST_ADDRESS)
    const phoneNumber = authHelper.isValidInfo(user.LIST_PHONE_NUMBER)

    return {
        accessToken,
        refreshToken,
        user_data: {
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
                COUNTRY: address.COUNTRY,
                CITY: address.CITY,
                DISTRICT: address.DISTRICT,
                WARD: address.WARD,
                ADDRESS_1: address.ADDRESS_1,
                ADDRESS_2: address.ADDRESS_2,
                STATE: address.STATE,
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
                COUNTRY_CODE: phoneNumber.COUNTRY_CODE,
                COUNTRY_NAME: phoneNumber.COUNTRY_NAME,
                AREA_CODE: phoneNumber.AREA_CODE,
                PHONE_NUMBER: phoneNumber.PHONE_NUMBER,
                FULL_PHONE_NUMBER: phoneNumber.FULL_PHONE_NUMBER
            },
            ACCOUNT_DEVICE: {
                DEVICE_ID: device.ID_DEVICE,
                DEVICE_NAME: device.NAME_DEVICE || '',
                LAST_TIME_LOGIN: device.LAST_TIME_LOGIN,
            },
            ACCESS_TOKEN_EXPIRY: Math.floor((Date.now() + ms(process.env.ACCESS_TOKEN_EXPIRY)) / 1000),
        }
    }
}

const handleRegistration = async (data) => {
  const existingUser = await User.findOne({EMAIL: data.email}) || await Account.findOne({USERNAME: data.username});
  if (existingUser) return { error: 'Email đã được đăng ký!' };
  await authService.sendVerificationEmail(data);
}

const handleCreateUser = async (data) => {
    const {username, password, gender, avatar, email, dob, 
        lastName, middleName, firstName, 
        country, city, district, ward, address1, address2, state,
        countryCode, countryName, areaCode, phoneNumber, fullPhoneNumber,
        relationship,
        isManager, isServiceStaff,
        createByUserId} = data;
        
    console.log(data)

    let role = {}

    if (isManager || isServiceStaff) {
        role = {
            IS_ADMIN: false,
            IS_MANAGER: isManager,
            IS_SERVICE_STAFF: isServiceStaff,
            IS_CUSTOMER: false,
        }
    }

    else {
        role = {
            IS_ADMIN: false,
            IS_MANAGER: false,
            IS_SERVICE_STAFF: false,
            IS_CUSTOMER: true
        }
    }

    const userData = {
        LIST_NAME: [
            {
                LAST_NAME: lastName,
                FIRST_NAME: firstName,
                MIDDLE_NAME: middleName,
                FULL_NAME: `${lastName} ${middleName} ${firstName}`,
                FROM_DATE: new Date(),
                THRU_DATE: null,
            }
        ],
        CURRENT_GENDER: gender, // 'Nam', 'Nữ', 'Khác'
        BIRTH_DATE: dob === null ? null : new Date(dob),
        AVATAR_IMG_URL: avatar || '',
        ROLE: role,
        LIST_EMAIL: [
            {
                EMAIL: email,
                FROM_DATE: new Date(),
                THRU_DATE: null,
            }
        ],
        LIST_ADDRESS: [
            {   
                COUNTRY: country,
                CITY: city,
                DISTRICT: district,
                WARD: ward,
                ADDRESS_1: address1,
                ADDRESS_2: address2,
                STATE: state,
                FROM_DATE: new Date(),
                THRU_DATE: null
            }
        ],
        LIST_PHONE_NUMBER: [
            {
                COUNTRY_CODE: countryCode,
                COUNTRY_NAME: countryName,
                AREA_CODE: areaCode,
                PHONE_NUMBER: phoneNumber,
                FULL_PHONE_NUMBER: fullPhoneNumber,
                FROM_DATE: new Date(),
                THRU_DATE: null,
            }
        ],
        LIST_CONTACT: [
            {
                LAST_NAME: lastName,
                FIRST_NAME: firstName,
                MIDDLE_NAME: middleName,
                FULL_NAME: `${lastName} ${middleName} ${firstName}`,
                PHONE_NUMBER: phoneNumber,
                ADDRESS_1: address1,
                ADDRESS_2: address2,
                EMAIL: email,
                WARD: ward,
                DISTRICT: district,
                CITY: city,
                STATE: state,
                COUNTRY: country,
                RELATIONSHIP: relationship,
                FROM_DATE: new Date(),
                THRU_DATE: null,
            }
        ]
    };



    let user = new User();
    try{
        //Tạo một đối tượng user
        user = await User.create(userData);
        // console.log(user);

        //Tạo đối tượng Account
        const accountData = {
            USERNAME: username,
            PASSWORD: await authService.hashPassword(password),
            CREATE_BY_USER_ID: createByUserId,
            FROM_DATE: new Date(),
            THRU_DATE: null,
            USER_ID: user._id,
        };

        const account = await Account.create(accountData);

        // Tạo đối tượng account device
        const accountDeviceData = {
            USER_ID: user._id,
        };

        const accountDevice = await AccountDevice.create(accountDeviceData);

        if (createByUserId) {
            return {
                username: username,
                password: password,
                email: email,
            }
        }

        // return handleUserDataForResponse(user, account, accountDevice)

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


// Kiểm tra thiết bị đăng nhập
const loginDevice = async (accountDevice, deviceId = null, deviceName, deviceType) => {

    // Kiểm tra thiết bị đăng nhập
    if (accountDevice.LIST_DEVICE_OF_ACCOUNT.length > 0) {
        for (let i = 0; i <= accountDevice.LIST_DEVICE_OF_ACCOUNT.length - 1; i++) {
            // Nếu thiết bị đã được lưu
            if (accountDevice.LIST_DEVICE_OF_ACCOUNT[i].ID_DEVICE === deviceId) {

                accountDevice.LIST_DEVICE_OF_ACCOUNT[i].LAST_TIME_LOGIN = new Date()

                try {
                    await accountDevice.save()
                } catch (error) {
                    throw new Error("Lỗi khi cập nhật last time login.")
                }

                return accountDevice.LIST_DEVICE_OF_ACCOUNT[i]
            }
        }
    }

    // Nếu là thiết bị mới
    const {privateKey, publicKey} = generateKeyPair()
    const newDevice = {
        ID_DEVICE: deviceId || null,
        NAME_DEVICE: deviceName || null,
        TYPE_DEVICE: deviceType || null,
        LAST_TIME_LOGIN: new Date(),
        PRIVATE_KEY: privateKey,
        PUBLIC_KEY: publicKey
    }
    accountDevice.LIST_DEVICE_OF_ACCOUNT.push(newDevice)

    try {
        await accountDevice.save()
    } catch (error) {
        throw new Error("Lỗi khi lưu thiết bị mới")
    }

    return newDevice
}

const login = async (data) => {
    const {username, email, password, deviceId, deviceName, deviceType} = data 

    if ((!username || !email) && !password) {
        return {error: "Vui lòng nhập đầy đủ thông tin đăng nhập."}
    }

    if (email) {
        const user = await User.findOne({ "LIST_EMAIL.EMAIL" : email})

        // Nếu user đăng nhập bằng email
        if (user) {

        if (!authHelper.isValidEmail(user, email)) {
            return {error: "Email đã được thay đổi. Vui lòng nhập email bạn đang dùng để đăng ký."}
        }
        
        // Lấy account theo user id
        const account = await Account.findOne({ USER_ID: user._id })
        if (!account) {
            throw new Error('Lỗi xảy ra khi truy xuất tài khoản.')
        }

            if (account.IS_ACTIVE === false) {
                return { error: "Tài khoản đã dừng hoạt động." }
            }

            if (account.IS_SUSPENDED === true) {
                return { error: "Tài khoản bị tạm khóa." }
            }

            // So sánh password
            if (! await authService.isMatchedPassword(password, account.PASSWORD)) {
                return {error: "Sai mật khẩu."}
            }

            const accountDevice = await AccountDevice.findOne({ USER_ID: user._id })

            if (!accountDevice) {
                throw new Error('Lỗi xảy ra khi truy xuất tài khoản.')
            }

            const device = await loginDevice(accountDevice, deviceId, deviceName, deviceType)

            const response = handleUserDataForResponse(user, account, device)

            return response
        }

        else {
            return {error: "Email chưa được đăng ký."}
        }
    }

    // Đăng nhập bằng username
    
    else {
        const account = await Account.findOne({USERNAME: username})
        if (!account) {
            return {error: "Tài khoản không tồn tại."}
        }      

        else {
            if (account.IS_ACTIVE === false) {
                return { error: "Tài khoản đã dừng hoạt động." }
            }

            if (account.IS_SUSPENDED === true) {
                return { error: "Tài khoản bị tạm khóa." }
            }

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

            const device = await loginDevice(accountDevice, deviceId, deviceName, deviceType)
          
            const response = handleUserDataForResponse(user, account, device)

            return response
        }
    }

};

const handleRefreshToken = async (userData) => {
  try {
    console.log("userData: ", userData)
    const {privateKey, error} = await authHelper.getSecretKey(userData.USER_ID, userData.DEVICE_ID);
    console.log("error: ", error)
    if(error) {
        return {error: "Thiết bị không hợp lệ 3"}
    }
    const newAccessToken = authService.generateAccessToken(userData, privateKey);
    const expToken = Math.floor((Date.now() + ms(process.env.ACCESS_TOKEN_EXPIRY)) / 1000); //timpestamp hết hạn
    return {newAccessToken, accessTokenExp: expToken};
  }catch (error) {
    console.error('Lỗi khi làm mới token:', error);
    return {error: "Lỗi khi làm mới token."}
  }
};

const handleLogout = async (userData, refreshToken, accessToken) => {
    try {
        const {publicKey, error} = await authHelper.getSecretKey(userData.USER_ID, userData.DEVICE_ID);
        if(error) {
            return {error: "Thiết bị không hợp lệ 2"}
        }
         if (refreshToken) {
            await addToBlacklist(refreshToken, publicKey);
        }

        if (accessToken) {
            await addToBlacklist(accessToken, publicKey);
        }
    } catch (error) {
        console.error('Lỗi khi đăng xuất:', error);
    }
}

const handleForgotPassword = async (data) => {

    if (!data.email) {
        return {error: "Vui lòng nhập email."}
    }
    
    const user = await User.findOne( {"LIST_EMAIL.EMAIL": data.email })

    if (!user) {
        return {error: "Email chưa được đăng ký"}
    }

    if (! await authHelper.isValidEmail(user, data.email)) {
        return {error: "Email đã được thay đổi. Vui lòng nhập email bạn đang dùng để đăng ký."}
    }

    await authService.sendVerificationEmail(data)
}

module.exports = {
    handleCreateUser,
    handleRegistration,
    login,
    handleRefreshToken,
    handleLogout,
    handleForgotPassword,
}