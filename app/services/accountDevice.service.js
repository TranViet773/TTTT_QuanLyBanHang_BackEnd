const AccountDevice = require('../models/account_device.model');

const createAccountDevice = async (accountDeviceData) => {
  const accountDevice = await AccountDevice.create(accountDeviceData);
  return accountDevice;
}

const getAllDevice = async (user) => {
  try {
    if (user.IS_CUSTOMER) {
      return await AccountDevice.findOne({ USER_ID: user.USER_ID })
    }

    else {
      return await AccountDevice.find()
    }
  } catch (error) {
    console.log(error)
    throw new Error('Lỗi xảy ra khi truy vấn dữ liệu thiết bị.')
  }
}

const getDeviceListByUserId = async (data) => {
  try {
    const {user, userId} = data
    if (user.IS_CUSTOMER) {
      return await AccountDevice.findOne({ USER_ID: user.USER_ID })
    }

    else {
      return await AccountDevice.findOne({ USER_ID: userId })
    }
  } catch (error) {
    console.log(error)
    throw new Error("Lỗi xảy ra khi truy vấn dữ liệu thiết bị")
  }
}

module.exports = {
  createAccountDevice,
  getAllDevice,
  getDeviceListByUserId
};