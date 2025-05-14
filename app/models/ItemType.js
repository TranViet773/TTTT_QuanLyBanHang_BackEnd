const mongoose = require('mongoose')

const itemTypeSchema = new mongoose.Schema({
    item_type_name: {
        type: String,
        required: true,
    },

    item_type_name_en: {
        type: String,
    }
})

module.exports = mongoose.model('ItemType', itemTypeSchema)