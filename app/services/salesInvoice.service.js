const updateItemForExporting = async (items, originalItems, backupItems, now) => {

    let totalAmount = 0     // tổng tiền hàng của hóa đơn
    let count = 0           // đếm số lượng các item đã update, hỗ trợ cho rollback không cần phải duyệt những item chưa được update

    for(const addItem of items) {

        for(const item of originalItems) {

            if(item.ITEM_CODE === addItem.ITEM_CODE) {

                const price = authHelper.isValidInfo(item.PRICE)
                addItem.UNIT = price.UNIT
                addItem.UNIT_PRICE = price.PRICE_AMOUNT
                addItem.TOTAL_PRICE = price.PRICE_AMOUNT * addItem.QUANTITY
                addItem.SUPPLIER_ID = null

                // Kiểm tra số lượng tồn kho của item
                if (item.ITEM_STOCKS.QUANTITY < addItem.QUANTITY) {
                    rollbackItems(count, originalItems, backupItems)
                    console.log("item sold out")
                    return ({error: `Số lượng tồn kho của ${item.ITEM_NAME} không đủ hoặc đã hết hàng.`})
                } 
                
                item.ITEM_STOCKS.QUANTITY -=  addItem.QUANTITY,
                item.ITEM_STOCKS.LAST_UPDATED = now

                try {
                    await item.save()
                    totalAmount += addItem.TOTAL_PRICE
                    count++
                    break
                } catch (error) {
                    rollbackItems(count, originalItems, backupItems)
                    console.log(error.message)
                    throw new Error("Lỗi khi cập nhật số lượng item.")
                }
            }
        }
    }

    return {totalAmount, count}
}