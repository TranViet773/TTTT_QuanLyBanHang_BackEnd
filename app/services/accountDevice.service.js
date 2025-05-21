const AccountDevice = require('../models/account_device.model');

const createAccountDevice = async (accountDeviceData) => {
  const accountDevice = await AccountDevice.create(accountDeviceData);
  return accountDevice;
}

module.exports = {
  createAccountDevice,
};