const AccountDevice = require('../models/AccountDevice.model');

const createAccountDevice = async (accountDeviceData) => {
  const accountDevice = await AccountDevice.create(accountDeviceData);
  return accountDevice;
}

const getAllDevice = async (user) => {
  try {
    if (user.IS_CUSTOMER) {
      return await AccountDevice.findOne({ USER_ID: user.USER_ID }).select('-LIST_DEVICE_OF_ACCOUNT.PRIVATE_KEY -LIST_DEVICE_OF_ACCOUNT.PUBLIC_KEY')
    }

    else {
      return await AccountDevice.find().select('-LIST_DEVICE_OF_ACCOUNT.PRIVATE_KEY -LIST_DEVICE_OF_ACCOUNT.PUBLIC_KEY')
    }
  } catch (error) {
    console.log(error)
    throw new Error('Lỗi xảy ra khi truy vấn dữ liệu thiết bị.')
  }
}

const getDeviceListByUserId = async (data) => {
  try {
    const {user, userId} = data
    if (user?.IS_CUSTOMER) {
      console.log('flag 1')
      return await AccountDevice.findOne({ USER_ID: user.USER_ID }).select('-LIST_DEVICE_OF_ACCOUNT.PRIVATE_KEY -LIST_DEVICE_OF_ACCOUNT.PUBLIC_KEY')
    }

    else {
      return await AccountDevice.findOne({ USER_ID: userId }).select('-LIST_DEVICE_OF_ACCOUNT.PRIVATE_KEY -LIST_DEVICE_OF_ACCOUNT.PUBLIC_KEY')
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