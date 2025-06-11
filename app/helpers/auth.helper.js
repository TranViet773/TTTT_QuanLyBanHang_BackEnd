const { default: mongoose } = require('mongoose');
const AccountDeviceModel = require('../models/AccountDevice.model');
const UserModel = require('../models/User.model');
const isValidEmail = (user, email) => {

    const now = new Date();

    // tạo bản sao và đảo ngược mảng trước khi duyệt
    return user.LIST_EMAIL.slice().reverse().some(e =>
        e.EMAIL === email &&
        e.FROM_DATE <= now &&
        (e.THRU_DATE === null || e.THRU_DATE > now)
    );
};

const isValidInfo = (listInfo) => {
    const now = new Date()
    // tạo bản sao và đảo ngược mảng trước khi duyệt
    return listInfo.slice().reverse().find(info =>
        info.FROM_DATE <= now &&
        (info.THRU_DATE === null || info.THRU_DATE > now)
    )
}


const getSecretKey = async (userId, deviceId) => {
    const accountDevice = await AccountDeviceModel.findOne({ USER_ID: userId});
    if(!accountDevice) {
        return {error: "Không tìm thấy device nào của người dùng!"};
    }
    
   const device = accountDevice.LIST_DEVICE_OF_ACCOUNT.find(device => device.ID_DEVICE === deviceId);

  if (!device) {
        return {error: "Người dùng chưa có thông tin thiết bị!"};
    }

    return {privateKey: device.PRIVATE_KEY, publicKey: device.PUBLIC_KEY};

};

module.exports = {
    isValidEmail,
    isValidInfo,
    getSecretKey
}