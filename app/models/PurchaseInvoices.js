const mongoose = require('mongoose')

const purchaseInvoicesSchema = new mongoose.Schema({
    invoice_code: {
        type: String,
        required: true,
        unique: true,
    },

    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
    },

    import_date: { type: Date },

    imported_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    status: [{
        type: new mongoose.Schema({
            status_name: {type: String},
            from_date: { type: Date, },
            thru_date: { type: Date, },
        }),

        _id: false,
    }],

    total_amount: {
        type: Number,
        required: true,
    },

    tax: {
        type: Number,
        required: true
    },

    total_with_tax: {
        type: Number,
        required: true,
    },

    items: [
        {
            type: new mongoose.Schema({
                item_code: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Item',
                },
                quantity: { type: Number },
                unit: { type: String, },
                unit_price: { type: Number },
                total_price: { type: Number },

            }),

            _id: false,
        },
    ]
})

module.exports = mongoose.model('PurchaseInvoices', purchaseInvoicesSchema)