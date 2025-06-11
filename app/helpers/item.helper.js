const Item = require('../models/Item.model');
const isValidPrice = (listPrice) => {
    const now = new Date()
    console.log(listPrice)
    // tạo bản sao và đảo ngược mảng trước khi duyệt
    return listPrice.slice().reverse().find(price =>
        price.FROM_DATE <= now &&
        (price.THRU_DATE === null || price.THRU_DATE > now)
    )
};

module.exports = {
    isValidPrice
};