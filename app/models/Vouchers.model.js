const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  VOUCHER_CODE: {
    type: String,
    required: true,
    unique: true,
  },
  TYPE: {
    type: String,
    enum: ["PERCENTAGE", "FIXED_AMOUNT"],
  },
  VALUE: {
    type: Number,
  },
  APPLY_SCOPE: {
    type: String,
    enum: ["GLOBAL", "PRODUCT"],
  },
  CREATE_BY: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  MAX_DISCOUNT: {
    type: Number,
    default: 0,
  },
  QUANTITY: {
    type: Number,
  },
  NUMBER_USING: {
    type: Number,
    default: 0,
  },
  START_DATE: {
    type: Date,
    required: true,
  },
  END_DATE: {
    type: Date,
    required: true,
  },
  IS_ACTIVE: {
    type: Boolean,
    required: true,
    default: true,
  },
});


module.exports = mongoose.model('Voucher', voucherSchema);