
// import thư viện MongoDB
const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema(
    {
        item_code: {
            type: String,
            required: true,
            unique: true,
        },

        item_name: {
            type: String,
            required: true,
        },
   
        item_name_en: {
            type: String,
        },
        
        item_type: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ItemType',
        },

        unit:{
            type: String,
            required: true,
        },
        
        price:[{
            type: new mongoose.Schema({
                priceAmount: {type: Number,},
                fromDate:{type: Date},
                thruDate:{type: Date},
            }),
        }],

        description: {
            type: String,
        },

        is_active: {
            type: Boolean,
            required: true,
        },

        import_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        item_stocks: {
            type: new mongoose.Schema({
                quantity: { type: Number, },
                last_update: { type: Date },
            }),
            _id: false,
        },

        bom_materials: [
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