const mongoose = require('mongoose')

const supplierSchema = new mongoose.Schema({
    supplier_name: {
        type: String,
        required: true,
    },

    supplier_phone: {
        type: String,
        match: [/^\d+$/, 'Chỉ chứa ký tự số']
    },

    supplier_address: {
        type: String,
    },

    supplier_email: {
        type: String,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },

    supplier_tax_code: {
        type: String,
    },

    supplier_contact_person_name: {
        type: String,
    },

    note: {
        type: String,
    },

    is_active: {
        type: Boolean,
        required: true,
    }
})

module.exports = mongoose.model('Supplier', supplierSchema)