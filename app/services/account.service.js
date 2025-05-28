const Account = require('../models/Account.model');
const User = require('../models/User.model')
const authHelper = require('../helpers/auth.helper')
const mailerHelper = require('../helpers/mailer.helper')
const fs = require("fs");
const path = require("path");

const handleSetSuspended = async (username, isSuspended) => {
    try {
        const updatedAccount = await Account.findOne( { USERNAME: username} );

        if ( updatedAccount.IS_SUSPENDED === isSuspended) {
            return ({ error: `Tài khoản hiện đã có trạng thái IS_SUSPENDED = ${isSuspended}` })
        }

        updatedAccount.IS_SUSPENDED = isSuspended
        updatedAccount.save()

        const { PASSWORD, ...safeUser } = updatedAccount._doc

        const user = await User.findById(updatedAccount.USER_ID)

        const email = await authHelper.isValidInfo(user.LIST_EMAIL)

        console.log(email)

        return {
            safeUser,
            email
        };
        // return updatedAccount;
    } catch (error) {
        console.error("Error updating account suspension status:", error);
        return {error: "Failed to update account suspension status."};
    }
};

const handleSetActive = async (username, isActive) => {
    try {
        const updatedAccount = await Account.findOne( { USERNAME: username} );

        if ( updatedAccount.IS_ACTIVE === isActive) {
            return ({ error: `Tài khoản hiện đã có trạng thái IS_ACTIVE = ${isActive}` })
        }

        updatedAccount.IS_ACTIVE = isActive
        updatedAccount.save()

        const { PASSWORD, ...safeUser } = updatedAccount._doc

        const user = await User.findById(updatedAccount.USER_ID)

        const email = await authHelper.isValidInfo(user.LIST_EMAIL)

        console.log(email)

        return {
            safeUser,
            email
        };
    } catch (error) {
        console.error("Error updating account active status:", error);
        return {error: "Failed to update account active status."};
    }
};

const sendBanNotificationEmail = async (banReason, email, username) => {
    const templatePath = path.join(__dirname, '..', 'helpers', 'templates', 'banNotificationTemplate.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    // Thay thế các biến trong template
    html = html.replace(/{{username}}/g, username);
    html = html.replace(/{{banReason}}/g, banReason);
    try {
        await mailerHelper.transporter.sendMail({
            from: `"Hệ thống quản lý doanh nghiệp" <${process.env.EMAIL}>`, 
            to: email,
            subject: 'Thông báo khóa tài khoản',
            html: html
        });
    } catch (error) {
        console.error('Lỗi gửi email khóa tài khoản:', error);
        throw new Error('Lỗi gửi email khoán tài khoản.')
    }
}


module.exports = {
    handleSetSuspended,
    handleSetActive,
    sendBanNotificationEmail,
};
