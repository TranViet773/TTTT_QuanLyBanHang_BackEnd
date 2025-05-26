
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
                PRICE_AMOUNT: {type: Number,},
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
                QUANTITY: { 
                    type: Number, 
                    min: [0, "Số lượng không được nhỏ hơn 0."]
                },
                LAST_UPDATED: { type: Date },
            }),
            _id: false,
        },

        BOM_MATERIALS: [
            {
                type: new mongoose.Schema({
                    ITEM_CODE: { type: String },
                    QUANTITY: { 
                        type: Number,
                        min: [1, "Số lượng phải ít nhất là 1"]
                    },
                    UNIT: { type: String },
                    FROM_DATE: { type: Date },
                    THRU_DATE: { type: Date },
                }),
            }
        ]
        
    }
)

module.exports = mongoose.model('Item', itemSchema)