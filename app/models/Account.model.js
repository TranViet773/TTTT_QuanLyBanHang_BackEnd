const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    USERNAME: {
        type: String,
        required: true,
        unique: true,
    },
    PASSWORD: {
        type: String,
        required: true,
        select: false,      // Không trả về mặc định khi truy vấn
        match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
            'Mật khẩu bao gồm có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
        ]
    },
    USER_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // VALID_EMAIL_BY_SSO: [{
    //     type: new mongoose.Schema({
    //         SSO_METHOD_NAME: {type: String},
    //         SSO_USER_ID: {type: String},
    //         SSO_IS_VALID: {type: Boolean},
    //     }),
    //     _id: false
    // }],
    CREATE_BY_USER_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    // LIST_CODE_ACTIVE: [
    //     {
    //         type: new mongoose.Schema({
    //             CODE: {
    //                 type: Mongoose.Schema.Types.ObjectId,
    //                 required: true,
    //                 unique: true,
    //             },
    //             EXP_DATE: {
    //                 type: Date,
    //                 required: true,
    //             },
    //             TYPE_ACTIVE: {
    //                 type: String,
    //                 enum: ['Xác thực', 'Password', 'Wallet'],
    //                 required: true,
    //             },
    //             IS_USING: {
    //                 type: Boolean,
    //                 default: false,
    //                 required: true,
    //             },
    //             SSO_METHOD_NAME: {
    //                 type: String
    //             }
    //         }),
    //         _id: false,
    //     }
    // ],
    IS_ACTIVE: {
        type: Boolean,
        default: true,
        required: true,
    },
    IS_SUSPENDED: {
        type: Boolean,
    }
})

module.exports = mongoose.model('Account', accountSchema);