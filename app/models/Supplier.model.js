const mongoose = require('mongoose')

const supplierSchema = new mongoose.Schema({
    SUPPLIER_NAME: {
        type: String,
        required: true,
    },

    SUPPLIER_PHONE: {
        type: String,
        match: [/^\d+$/, 'Chỉ chứa ký tự số']
    },

    SUPPLIER_ADDRESS: {
        type: String,
    },

    SUPPLIER_EMAIL: {
        type: String,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },

    SUPPLIER_TAX_CODE: {
        type: String,
    },

    SUPPLIER_CONTACT_PERSON_NAME: {
        type: String,
    },

    NOTE: {
        type: String,
    },

    IS_ACTIVE: {
        type: Boolean,
        required: true,
        default: true,
    }
})

module.exports = mongoose.model('Supplier', supplierSchema)