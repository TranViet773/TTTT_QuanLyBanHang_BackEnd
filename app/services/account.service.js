const Account = require('../models/Account.model');

const handleSetSuspended = async (username, isSuspended) => {
    try {
        const updatedAccount = await Account.findOneAndUpdate(
            { USERNAME: username},
            { IS_SUSPENDED: isSuspended },
            { new: true }
        );
        return updatedAccount;
    } catch (error) {
        console.error("Error updating account suspension status:", error);
        return {error: "Failed to update account suspension status."};
    }
};

const handleSetActive = async (accountId, isActive) => {
    try {
        const updatedAccount = await Account.findByIdAndUpdate(
            accountId,
            { IS_ACTIVE: isActive },
            { new: true }
        );
        return updatedAccount;
    } catch (error) {
        console.error("Error updating account active status:", error);
        return {error: "Failed to update account active status."};
    }
};


module.exports = {
    handleSetSuspended,
    handleSetActive
};
