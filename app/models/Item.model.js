
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
            type: String,
            required: true,
        },
        
        PRICE:[{
            type: new mongoose.Schema({
                priceAmount: {type: Number,},
                fromDate:{type: Date},
                thruDate:{type: Date},
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
                quantity: { type: Number, },
                last_update: { type: Date },
            }),
            _id: false,
        },

        BOM_MATERIALS: [
            {
                type: new mongoose.Schema({
                    item_code: { type: String },
                    quantity: { type: Number },
                    unit: { type: String },
                    from_date: { type: Date },
                    thru_date: { type: Date },
                }),
            }
        ]
        
    },
    { 
        timestamp: true 
    }
)

module.exports = mongoose.model('Item', itemSchema)