const mongoose = require('mongoose');
const unitItemSchema = new mongoose.Schema(
    {
        UNIT_ITEM_NAME: {
            type: String
        },
        UNIT_ITEM_NAME_EN: {
            type: String
        },
        UNIT_ITEM_ABB: {
            type: String
        }
    }
);

module.exports = mongoose.model('Unit_Item', unitItemSchema);