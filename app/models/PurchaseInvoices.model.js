const mongoose = require('mongoose')

const purchaseInvoicesSchema = new mongoose.Schema({
    INVOICE_CODE: {
        type: String,
        required: true,
        unique: true,
    },

    SUPPLIER: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
    },

    IMPORT_DATE: { type: Date },

    IMPORTED_BY: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    STATUS: [{
        type: new mongoose.Schema({
            status_name: {type: String},
            from_date: { type: Date, },
            thru_date: { type: Date, },
        }),

        _id: false,
    }],

    TOTAL_AMOUNT: {
        type: Number,
        required: true,
    },

    TAX: {
        type: Number,
        required: true
    },

    TOTAL_WITH_TAX: {
        type: Number,
        required: true,
    },

    ITEMS: [
        {
            type: new mongoose.Schema({
                ITEM_CODE: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Item',
                },
                QUANTITY: { type: Number },
                UNIT: { type: String, },
                UNIT_PRICE: { type: Number },
                TOTAL_PRICE: { type: Number },

            }),

            _id: false,
        },
    ]
})

module.exports = mongoose.model('Purchase_Invoices', purchaseInvoicesSchema)