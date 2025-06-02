const mongoose = require('mongoose')

const purchaseInvoicesSchema = new mongoose.Schema({
    INVOICE_CODE: {
        type: String,
        required: true,
        unique: true,
    },

    IMPORT_DATE: { type: Date },

    IMPORTED_BY: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    STATUS: [{
        type: new mongoose.Schema({
            STATUS_NAME: {
                type: String,
                enum: ["DRAFT", "PENDING_APPROVAL", "CONFIRMED", "REJECTED", "PAYMENTED"],
            },
            FROM_DATE: { type: Date, },
            THRU_DATE: { type: Date, },
        }),

        _id: false,
    }],

    TOTAL_AMOUNT: {
        type: Number,
        required: true,
        min: [0, "Số tiền (total amount) không thể là số âm."]
    },

    EXTRA_FEE: {
        type: Number,
        min: [0, "Số tiền (extra fee) không thể là số âm."]
    },

    EXTRA_FEE_UNIT: {
        type: mongoose.Schema.Types.ObjectId,
    },

    EXTRA_FEE_NOTE: {
        type: String,
    },

    TAX: {
        type: Number,
        min: [0, "Thuế không thể là số âm."]
    },

    TOTAL_WITH_TAX_EXTRA_FEE: {
        type: Number,
        min: [0, "Số tiền (total) không thể là số âm."] 
    },

    ITEMS: [
        {
            type: new mongoose.Schema({
                ITEM_CODE: {
                    type: String,
                    require: true,
                },
                SUPPLIER_ID: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Supplier',
                },
                QUANTITY: { 
                    type: Number,
                    min: [1, "Số lượng phải ít nhất bằng 1"]
                },
                UNIT: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Unit_Invoice"
                },
                UNIT_PRICE: { 
                    type: Number,
                    min: [0, "Số tiền (unit price/item) không thể là số âm."]
                 },
                TOTAL_PRICE: { 
                    type: Number,
                    min: [0, "Số tiền (total price/item) không thể là số âm."]
                },
            }),

            _id: false,
        },
    ],

    PAYMENTED: {
        type: String,
        enum: ["Tiền mặt", "Chuyển khoản"],
    }
})

module.exports = mongoose.model('Purchase_Invoices', purchaseInvoicesSchema)