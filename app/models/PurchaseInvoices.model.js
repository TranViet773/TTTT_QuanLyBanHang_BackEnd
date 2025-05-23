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
                enum: ["DRAFT", "PENDING_APPROVAL","CONFIRMED","REJECTED","PAYMENTED"],
            },
            FROM_DATE: { type: Date, },
            THRU_DATE: { type: Date, },
        }),

        _id: false,
    }],

    TOTAL_AMOUNT: {
        type: Number,
        required: true,
    },

    EXTRA_FEE: {
        type: Number,
    },

    EXTRA_FEE_UNIT: {
        type: mongoose.Schema.Types.ObjectId,
    },

    EXTRA_FEE_NOTE: {
        type: String,
    },

    TAX: {
        type: Number,
    },

    TOTAL_WITH_TAX_EXTRA_FEE: {
        type: Number,
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
                QUANTITY: { type: Number },
                UNIT: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "UnitInvoice"
                },
                UNIT_PRICE: { type: Number },
                TOTAL_PRICE: { type: Number },
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