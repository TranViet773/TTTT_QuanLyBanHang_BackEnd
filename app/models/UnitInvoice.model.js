const mongoose = require("mongoose")

const unitInvoice = new mongoose.Schema({
    UNIT_NAME: {
        type: String,
    },
    UNIT_NAME_EN: {
        type: String,
    },
    UNIT_ABB: {
        type: String,
    }
})

module.exports = mongoose.model('Unit_Invoice', unitInvoice)