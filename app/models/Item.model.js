
// import thư viện MongoDB
const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema(
    {
        ITEM_CODE: {
            type: String,
            required: true,
            unique: true,
        },

        ITEM_NAME: {
            type: String,
            required: true,
        },
   
        ITEM_NAME_EN: {
            type: String,
        },
        
        ITEM_TYPE: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ItemType',
        },

        UNIT:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit_Item',
            required: true,
        },
        
        PRICE:[{
            type: new mongoose.Schema({
                PRICE_AMOUNT: {type: Number,},
                UNIT: {type: mongoose.Schema.Types.ObjectId}, //UNIT_INVOICE
                FROM_DATE:{type: Date},
                THRU_DATE:{type: Date},
            }),
        }],

        DESCRIPTION: {
            type: String,
        },

        IS_ACTIVE: {
            type: Boolean,
            required: true,
        },

        IMPORTED_BY: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        UPDATED_AT: {
            type: Date,
            default: Date.now,
        },

        CREATED_AT: {
            type: Date,
            default: Date.now,
        },

        ITEM_STOCKS: {
            type: new mongoose.Schema({
                QUANTITY: { type: Number, },
                LAST_UPDATED: { type: Date },
            }),
            _id: false,
        },

        BOM_MATERIALS: [
            {
                type: new mongoose.Schema({
                    ITEM_CODE: { 
                        type: String, 
                        required: true 
                    },
                    QUANTITY: { type: Number },
                    UNIT:{
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Unit_Item',
                        required: true,
                    },
                    FROM_DATE: { type: Date },
                    THRU_DATE: { type: Date },
                }),
                _id: false,
            }
        ],

        LIST_VOUCHER_ACTIVE: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Vouchers',
            }
        ],
    },
    { 
        timestamps: true 
    }
)

module.exports = mongoose.model('Item', itemSchema)