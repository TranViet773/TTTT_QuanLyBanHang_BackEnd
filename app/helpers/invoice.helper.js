const Item = require('../models/Item.model')

const getItemDocument = async (items) => {
    const itemCodes = items.map(item => item.ITEM_CODE)

    const originalItems = await (async () => {
        try {
            return await Item.find({
                ITEM_CODE: { $in: itemCodes }
            })
        } catch (error) {
            console.log(error.message)
            return null
        }
    })()

    if (!originalItems) {
        return ({error: "Không tìm thấy item tương ứng."})
    }

    // copy lại items để rollback khi xảy ra lỗi
    // đây là plain object, không phải mongoose document (không thể gọi các hàm như .save(),...)
    const backupItems = originalItems.map(item => ({ ...item.toObject?.() || item}))

    return {originalItems, backupItems}
}

const rollbackItems = async (count, originalItems, backupItems) => {
    if (count > 0) {
        for(let i=0; i < count; i++) {
            originalItems[i].ITEM_STOCKS.QUANTITY = backupItems[i].ITEM_STOCKS.QUANTITY
            originalItems[i].ITEM_STOCKS.LAST_UPDATED = backupItems[i].ITEM_STOCKS.LAST_UPDATED
            
            await originalItems[i].save()
        }
    }
}

module.exports = {
    getItemDocument,
    rollbackItems
}