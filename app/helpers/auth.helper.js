const AccountDeviceModel = require('../models/AccountDevice.model');
const UserModel = require('../models/User.model');
const isValidEmail = (user, email) => {

    const now = new Date();
    return user.LIST_EMAIL.some(e =>
        e.EMAIL === email &&
        e.FROM_DATE <= now &&
        (e.THRU_DATE === null || e.THRU_DATE > now)
    );
};

const getSecretKey = async (userId, deviceId) => {
    const accountDevice = await AccountDeviceModel.findOne({ USER_ID: userId});
    if(!accountDevice) {
        return {error: "Thiết bị không hợp lệ 0"};
    }
    
    const device = accountDevice.LIST_DEVICE_OF_ACCOUNT.find(device => device.ID_DEVICE === deviceId);
    if (!device) {
        return {error: "Thiết bị không hợp lệ 2"};
    }

    return {privateKey: device.PRIVATE_KEY, publicKey: device.PUBLIC_KEY};

};

module.exports = {
    isValidEmail,
    getSecretKey
}