const mongoose = require("mongoose")

const salesInvoices = new mongoose.Schema({
    INVOICE_CODE: {
        type: String,
        required: true,
        unique: true,
    },

    CUSTOMER_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    SELL_DATE: {
        type: Date
    },

    SOLD_BY: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    STATUS: {
        type: String,
        enum: ['DRAFT', 'CONFIRMED', 'CANCELLED', 'PAYMENTED'],
    },

    DELIVERY_INFORMATION: {
        type: new mongoose.Schema({
            NAME: {
                type: String
            },
            ADDRESS: {
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
                    DETAIL: {
                        type: String
                    },
                }),
                _id: false,
                required: true,
            },
            PHONE_NUMBER: {
                type: String,
                required: true,
                match: [/^\d+$/, 'Chỉ được chứa ký tự số']
            },
            EMAIL: {
                type: String,
                lowercase: true,
                match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
            }
        }),
        _id: false
    },

    NOTE: {
        type: String,
    },

    ITEMS: [{
        type: new mongoose.Schema({
            ITEM_CODE: {
                type: String,
                require: true
            },

            QUANTITY: {
                type: Number,
                min: [1, 'Số lượng phải ít nhất bằng 1']
            },

            UNIT: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Unit_Invoices"
            },

            UNIT_PRICE: {
                type: Number,
                min: [0, "Số tiền (extra fee) không thể là số âm."]
            },

            TOTAL_PRICE: {
                type: Number,
                min: [0, "Số tiền (extra fee) không thể là số âm."]
            },

            PRODUCT_VOUCHER_ID: {
                type: mongoose.Schema.Types.ObjectId,
            }
        }),
        _id: false,
    }],

    TOTAL_AMOUNT: {
        type: Number,
        min: [0, "Số tiền (total amount) không thể là số âm."],
    },

    VOUCHER_GLOBAL_ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher'
    },

    TAX: {
        type: Number,
        min: [0, "Thuế không thể là số âm."],
    },

    EXTRA_FEE: {
        type: Number,
        min: [0, "Số tiền (extra fee) không thể là số âm."],
    },

    EXTRA_FEE_UNIT: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit_Invoices',
    },

    EXTRA_FEE_NOTE: {
        type: String
    },

    TOTAL_WITH_TAX_EXTRA_FEE: {
        type: Number,
        min: [0, 'Số tiền (total) không thể là số âm.'],
    },

    PAYMENT_METHOD: {
        type: String,
        enum: ['Tiền mặt', 'Chuyển khoản'],
    },

    PURCHASE_METHOD: {
        type: String,
        enum: ['IN_STORE', 'DELIVERY', 'ONLINE', 'PRE_ORDER']
    },

    CREATED_AT: {
        type: Date,
    },

    UPDATED_AT: {
        type: Date
    }
})

module.exports = mongoose.model('Sales_Invoices', salesInvoices)