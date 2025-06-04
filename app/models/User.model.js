
// import thư viện MongoDB
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        LIST_NAME: [
            {
                type: new mongoose.Schema({
                    LAST_NAME: {
                        type: String,
                    },
                    FIRST_NAME: {
                        type: String,
                    },
                    MIDDLE_NAME: {
                        type: String,
                    },
                    FULL_NAME: {
                        type: String,
                        required: true,
                    },
                    FROM_DATE: {
                        type: Date,
                    },
                    THRU_DATE: {
                        type: Date,
                    }
                }),
                required: true,
                _id: false,
            }
        ],
        
        CURRENT_GENDER: {
            type: String,
            enum: ['Nam', 'Nữ', 'Khác'],
            required: true,
        },

        BIRTH_DATE: {
            type: Date,
        },

        AVATAR_IMG_URL: {
            type: String,
        },

        LIST_ADDRESS: [
            {
                type: new mongoose.Schema({
                    COUNTRY: {
                        type: String,
                    },
                    CITY: {
                        type: String,
                    },
                    DISTRICT: {
                        type: String,
                    },
                    WARD: {
                        type: String,
                    },
                    ADDRESS_1: {
                        type: String,
                    },
                    ADDRESS_2: {
                        type: String,
                    },
                    STATE: {
                        type: String,
                    },
                    FROM_DATE: {
                        type: Date,
                    },
                    THRU_DATE: {
                        type: Date,
                    }
                }),
                _id: false,
            }
        ],

        ROLE: {
            type: new mongoose.Schema({
                IS_ADMIN: {
                    type: Boolean,
                    default: false,
                },
                IS_MANAGER: {
                    type: Boolean,
                    default: false,
                },
                IS_SERVICE_STAFF: {
                    type: Boolean,
                    default: false,
                },
                IS_CUSTOMER: {
                    type: Boolean,
                    default: true,
                },
            }),
            required: true,
            _id: false,     // Không tạo id cho schema con
        },
        
        LIST_EMAIL: [
            {
                type: new mongoose.Schema({
                    EMAIL: {
                        type: String,
                        lowercase: true,
                        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
                    },
                    FROM_DATE: {
                        type: Date,
                    },
                    THRU_DATE: {
                        type: Date,
                    },
                }),
                required: true,
                _id: false,
            }
        ],

        LIST_PHONE_NUMBER: [
            {
                type: new mongoose.Schema({
                    COUNTRY_CODE: {
                        type: String,
                        required: true,
                    },
                    COUNTRY_NAME: { type: String },
                    AREA_CODE: {
                        type: String,
                        required: true,
                    },
                    PHONE_NUMBER: {
                        type: String,
                        required: true,
                        match: [/^\d+$/, 'Chỉ được chứa ký tự số'],
                    },
                    FULL_PHONE_NUMBER: { type: String, },
                    FROM_DATE: { type: Date, },
                    THRU_DATE: { type: Date, },
                }),
                _id: false,
            }
        ],

        LIST_CONTACT: [
            {
                type: new mongoose.Schema({
                    LAST_NAME: { type: String, },
                    FIRST_NAME: { type: String, },
                    MIDDLE_NAME: { type: String, },
                    FULL_NAME: { type: String, },
                    PHONE_NUMBER: { type: String, },
                    ADDRESS_1: { type: String, },
                    ADDRESS_2: { type: String, },
                    EMAIL: {
                        type: String,
                        lowercase: true,
                        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
                    },
                    WARD: { type: String, },
                    DISTRICT: { type: String, },
                    CITY: { type: String, },
                    STATE: { type: String, },
                    COUNTRY: { type: String, },
                    RELATIONSHIP: { type: String, },
                    FROM_DATE: { type: Date, },
                    THRU_DATE: { type: Date, },
                }),
                _id: false,     
            }
        ],

        GOOGLE_SUB_ID: {
            type: String,
            required: false
        }
    }
)

module.exports = mongoose.model('User', userSchema)