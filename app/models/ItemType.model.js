const mongoose = require('mongoose')

const itemTypeSchema = new mongoose.Schema({
    ITEM_TYPE_NAME: {
        type: String,
        required: true,
    },

    ITEM_TYPE_NAME_EN: {
        type: String,
    }
})

module.exports = mongoose.model('Item_Type', itemTypeSchema)