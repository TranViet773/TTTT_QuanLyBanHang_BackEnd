const User = require('../models/User.model');
const Account = require('../models/Account.model');
const AccountDevice = require('../models/AccountDevice.model');
const authService = require('../services/auth.service');
const authHelper = require('../helpers/auth.helper')
const { isValidInfo } = require('../helpers/auth.helper');

const { generateKeyPairSync } = require('crypto');
const ms = require('ms');

// tạo cặp khóa RSA cho từng thiết bị đăng nhập
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
// hàm kiểm tra email hoặc username đã tồn tại hay chưa
const handleRegistration = async (data) => {
    const existingUser = await User.findOne({ EMAIL: data.email }) || await Account.findOne({ USERNAME: data.username });
    if (existingUser) return { error: 'Email đã được đăng ký!' };
    await authService.sendVerificationEmail(data);
}

const handleCreateUser = async (data) => {
    const { username, password, lastName, firstName, gender, avatar, email, dob } = data;

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
    try {
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

        const accountDeviceData = {
            USER_ID: user._id
        };

        const accountDevice = await AccountDevice.create(accountDeviceData);

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
    } catch (error) {
        //Rollback khi có lỗi
        const userExisted = await User.findOne({ _id: user._id });
        if (userExisted) {
            await User.deleteOne({ _id: user._id });
        }

        const accountExisted = await Account.findOne({ USER_ID: user._id });
        if (accountExisted) {
            await Account.deleteOne({ USER_ID: user._id });
        }

        const accountDeviceExisted = await AccountDevice.findOne({ USER_ID: user._id });
        if (accountDeviceExisted) {
            await AccountDevice.deleteOne({ USER_ID: user._id });
        }

        console.error('Error creating user:', error);
        return { error: 'Lỗi khi tạo tài khoản' };
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
    const { privateKey, publicKey } = generateKeyPair()
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
    const { username, email, password, deviceId } = data
    const user = await User.findOne({ "LIST_EMAIL.EMAIL": email })

    if ((!username || !email) && !password) {
        return { error: "Vui lòng nhập đầy đủ thông tin đăng nhập." }
    }

    // Nếu user đăng nhập bằng email
    if (user) {

        if (!authHelper.isValidEmail(user, email)) {
            return { error: "Email đã được thay đổi. Vui lòng nhập email bạn đang dùng để đăng ký." }
        }

        // Lấy account theo user id
        const account = await Account.findOne({ USER_ID: user._id })
        if (!account) {
            throw new Error('Lỗi xảy ra khi truy xuất tài khoản.')
        }

        // So sánh password
        if (! await authService.isMatchedPassword(password, account.PASSWORD)) {
            return { error: "Sai mật khẩu." }
        }

        const accountDevice = await AccountDevice.findOne({ USER_ID: user._id })
        console.log(accountDevice)
        console.log(user._id)
        if (!accountDevice) {
            throw new Error('Lỗi xảy ra khi truy xuất tài khoản.')
        }

        const device = await loginDevice(accountDevice, deviceId)

        // Lấy dữ liệu cho token
        const verifyData = {
            USER_ID: user._id,
            USERNAME: account.USERNAME,
            FIRST_NAME: user.LIST_NAME[user.LIST_NAME.length - 1].FIRST_NAME,
            LAST_NAME: user.LIST_NAME[user.LIST_NAME.length - 1].LAST_NAME,
            EMAIL: user.LIST_EMAIL[user.LIST_EMAIL.length - 1].EMAIL,
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
        const account = await Account.findOne({ USERNAME: username })
        if (!account) {
            return { error: "Tài khoản không tồn tại." }
        }

        else {
            if (! await authService.isMatchedPassword(password, account.PASSWORD)) {
                return { error: "Sai mật khẩu." }
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
                FIRST_NAME: user.LIST_NAME[user.LIST_NAME.length - 1].FIRST_NAME,
                LAST_NAME: user.LIST_NAME[user.LIST_NAME.length - 1].LAST_NAME,
                EMAIL: user.LIST_EMAIL[user.LIST_EMAIL.length - 1].EMAIL,
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

};

const handleRefreshToken = async (userData) => {
    try {
        console.log("userData: ", userData)
        const { privateKey, error } = await authHelper.getSecretKey(userData.USER_ID, userData.DEVICE_ID);
        console.log("error: ", error)
        if (error) {
            return { error: "Thiết bị không hợp lệ 3" }
        }
        const newAccessToken = authService.generateAccessToken(userData, privateKey);
        const expToken = Math.floor((Date.now() + ms(process.env.ACCESS_TOKEN_EXPIRY)) / 1000); //timpestamp hết hạn
        return { newAccessToken, accessTokenExp: expToken };
    } catch (error) {
        console.error('Lỗi khi làm mới token:', error);
        return { error: "Lỗi khi làm mới token." }
    }
};

const handleLogout = async (userData, refreshToken, accessToken) => {
    try {
        const { publicKey, error } = await authHelper.getSecretKey(userData.USER_ID, userData.DEVICE_ID);
        if (error) {
            return { error: "Thiết bị không hợp lệ 2" }
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

const updateUser = async (userId, data) => {
    const user = await User.findById(userId);
    if (!user) {
        return { error: 'Người dùng không tồn tại' };
    }
    // Cập nhật thông tin người dùng
    if (data.firstName || data.lastName) {
          const now = new Date(); 
        // cập nhật ngày kết thúc của tên hiện tại
        const currentName = user.LIST_NAME.find(name => isValidInfo([name]));
        if (currentName) {
            currentName.THRU_DATE = now;
        }
        // tạo tên mới
        // nếu không có lastName thì lấy firstName
        const fullName = `${data.lastName || ''} ${data.firstName || ''}`.trim();
       // tạo bản ghi mới cho tên
        user.LIST_NAME.push({
            LAST_NAME: data.lastName || '',
            FIRST_NAME: data.firstName || '',
            MIDDLE_NAME: '',
            FULL_NAME: fullName,
            FROM_DATE: now,
            THRU_DATE: null,
        });
    }
    if (data.gender) {
        user.CURRENT_GENDER = data.gender;
    }
    if (data.dob) {
        user.BIRTH_DATE = new Date(data.dob);
    }
    if (data.avatar) {
        user.AVATAR_IMG_URL = data.avatar;
    }
   
    if (data.address) {
        const  now = new Date();
        const currentAddress = user.LIST_ADDRESS.find(address => isValidInfo([address]));
        if (currentAddress) {
            currentAddress.THRU_DATE = now;
        }
        user.LIST_ADDRESS.push({
            COUNTRY: data.address.country || '',
            CITY: data.address.city || '',
            DISTRICT: data.address.district || '',
            WARD: data.address.ward || '',
            ADDRESS_1: data.address.address1 || '',
            ADDRESS_2: data.address.address2 || '',
            STATE: data.address.state || '',
            FROM_DATE: now,
            THRU_DATE: null,
        });
    }
    if (data.phone ){
        const now = new Date();
        // tìm kiếm số điện thoại còn hiệu lực
        const currentPhone = user.LIST_PHONE_NUMBER.find(phone => isValidInfo([phone]));
        // nếu có thì cập nhật nó thành ngày kết thúc
        if (currentPhone) {
            currentPhone.THRU_DATE = now;
        }
        // tạo bản ghi mới cho số điện thoại
        user. LIST_PHONE_NUMBER.push({
            COUNTRY_CODE: data.phone.countryCode || '',
            COUNTRY_NAME: data.phone.countryName || '',
            AREA_CODE: data.phone.areaCode || '',
            PHONE_NUMBER: data.phone.phoneNumber || '',
            FULL_PHONE_NUMBER: data.phone.fullPhoneNumber || '',
            FROM_DATE: new Date(),
            THRU_DATE: null,
        });
    }
    await user.save();
    return {
        success: true,
        message: 'Cập nhật thông tin người dùng thành công'
    };



};

module.exports = {
    handleCreateUser,
    handleRegistration,
    login,
    handleRefreshToken,
    handleLogout,
    updateUser,
}