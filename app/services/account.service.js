const Account = require('../models/Account.model');

const createAccount = async (accountData) => {
  const account = await Account.create(accountData);
  return account;
}

module.exports = {
  createAccount,
};
