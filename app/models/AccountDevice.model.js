const mongoose = require('mongoose');

const accountDeviceSchema = new mongoose.Schema({
    USER_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    LIST_DEVICE_OF_ACCOUNT: [
        {
            ID_DEVICE: {
                type: String,
            },
            NAME_DEVICE: {
                type: String,
            },
            TYPE_DEVICE: {
                type: String,
            },
            LAST_TIME_LOGIN: {
                type: Date,
            },
            PRIVATE_KEY: {
                type: String,
            },
            PUBLIC_KEY: {
                type: String,
            },
        }
    ]
})

module.exports = mongoose.model('Account_Device', accountDeviceSchema);