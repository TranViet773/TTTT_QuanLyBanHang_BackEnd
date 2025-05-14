
// import thư viện MongoDB
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        list_name: [
            {
                type: new mongoose.Schema({
                    last_name: {
                        type: String,
                    },
                    first_name: {
                        type: String,
                    },
                    middle_name: {
                        type: String,
                    },
                    full_name: {
                        type: String,
                        required: true,
                    },
                    from_date: {
                        type: Date,
                    },
                    thru_date: {
                        type: Date,
                    }
                }),
                required: true,
                _id: false,
            }
        ],
        
        current_gender: {
            type: String,
            enum: ['Nam', 'Nữ', 'Khác'],
            required: true,
        },

        birth_date: {
            type: Date,
        },

        avatar_img_url: {
            type: String,
        },

        list_address: [
            {
                type: new mongoose.Schema({
                    country: {
                        type: String,
                    },
                    city: {
                        type: String,
                    },
                    district: {
                        type: String,
                    },
                    ward: {
                        type: String,
                    },
                    address_1: {
                        type: String,
                    },
                    address_2: {
                        type: String,
                    },
                    state: {
                        type: String,
                    },
                    from_date: {
                        type: Date,
                    },
                    thru_date: {
                        type: Date,
                    }
                }),
                _id: false,
            }
        ],

        role: {
            type: new mongoose.Schema({
                is_admin: {
                    type: Boolean,
                    default: false,
                },
                is_manager: {
                    type: Boolean,
                    default: false,
                },
                is_service_staff: {
                    type: Boolean,
                    default: false,
                },
                is_customer: {
                    type: Boolean,
                    default: true,
                },
            }),
            required: true,
            _id: false,     // Không tạo id cho schema con
        },
        
        list_email: [
            {
                type: new mongoose.Schema({
                    email: {
                        type: String,
                    },
                    from_date: {
                        type: String,
                    },
                    thru_date: {
                        type: String,
                    },
                }),
                required: true,
                _id: false,
            }
        ],

        list_phone_number: [
            {
                type: new mongoose.Schema({
                    country_code: {
                        type: String,
                        required: true,
                    },
                    country_name: { type: String },
                    area_code: {
                        type: String,
                        required: true,
                    },
                    phone_number: {
                        type: String,
                        required: true,
                    },
                    full_phone_number: { type: String, },
                    from_date: { type: Date, },
                    thru_date: { type: Date, },
                }),
                _id: false,
            }
        ],

        list_contact: [
            {
                type: new mongoose.Schema({
                    last_name: { type: String, },
                    first_name: { type: String, },
                    middle_name: { type: String, },
                    full_name: { type: String, },
                    phone_number: { type: String, },
                    address_1: { type: String, },
                    address_2: { type: String, },
                    email: { type: String, },
                    ward: { type: String, },
                    district: { type: String, },
                    city: { type: String, },
                    state: { type: String, },
                    country: { type: String, },
                    relationship: { type: String, },
                    from_date: { type: String, },
                    thru_date: { type: String, },
                }),
                _id: false,
            }
        ]
    }
)