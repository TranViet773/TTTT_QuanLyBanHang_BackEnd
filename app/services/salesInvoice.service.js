const SalesInvoice = require('../models/SalesInvoices.model')
const Account = require('../models/Account.model')
const User = require('../models/User.model')
const Item = require('../models/Item.model')
const Voucher = require('../models/Vouchers.model')
const voucherService = require('../services/voucher.service')
const authHelper = require('../helpers/auth.helper')
const invoiceHelper = require('../helpers/invoice.helper')


const handleInvoiceDataForResponse = async (invoice) => {
    console.log(invoice)

    try {
        const pipeline = [
            {
                $lookup: {
                    from: "items",
                    localField: 'ITEMS.ITEM_CODE',
                    foreignField: 'ITEM_CODE',
                    as: 'ITEM_DETAILS'
                },
            },

            {
                $lookup: {
                    from: 'unit_invoices',
                    localField: 'ITEMS.UNIT',
                    foreignField: '_id',
                    as: 'ITEM_UNIT_INVOICES'
                }
            },

            {
                $lookup: {
                    from: 'vouchers',
                    localField: 'ITEMS.PRODUCT_VOUCHER_ID',
                    foreignField: '_id',
                    as: 'ITEM_VOUCHERS'
                }
            },

            {
                $addFields: {
                    ITEMS: {
                        $map: {
                            input: '$ITEMS',
                            as: 'item',
                            in: {
                                $mergeObjects: [
                                    '$$item',
                                    
                                    {
                                        $let: {
                                            vars: {
                                                matchedItem: {
                                                    $arrayElemAt: [{
                                                        $filter: {
                                                            input: "$ITEM_DETAILS",
                                                            as: 'item_detail',
                                                            cond: {
                                                                $eq: ['$$item.ITEM_CODE', '$$item_detail.ITEM_CODE']
                                                            }
                                                        }
                                                    }, 0]
                                                }
                                            },
                                            in: {
                                                ITEM_DETAIL: {
                                                    ITEM_NAME: "$$matchedItem.ITEM_NAME",
                                                    ITEM_NAME_EN: '$$matchedItem.ITEM_NAME_EN',
                                                    AVATAR_IMG_URL: '$$matchedItem.AVATAR_IMG_URL',
                                                }
                                            }
                                        }                                        
                                    },

                                    {
                                        $let: {
                                            vars: {
                                                matchedUnit: {
                                                    $arrayElemAt: [{
                                                        $filter: {
                                                            input: '$ITEM_UNIT_INVOICES',
                                                            as: 'unit',
                                                            cond: {
                                                                $eq: ['$$item.UNIT', '$$unit._id']
                                                            }
                                                        }
                                                    }, 0]
                                                }
                                            },

                                            in: {
                                                UNIT: {
                                                    UNIT_NAME: '$$matchedUnit.UNIT_NAME',
                                                    UNIT_NAME_EN: '$$matchedUnit.UNIT_NAME_EN',
                                                    UNIT_ABB: '$$matchedUnit.UNIT_ABB',
                                                }
                                            }
                                        }                                     
                                    },

                                    {
                                        $let: {
                                            vars: {
                                                matchedVoucher: {
                                                    $arrayElemAt: [{
                                                        $filter: {
                                                            input: '$ITEM_VOUCHERS',
                                                            as: 'voucher',
                                                            cond: {
                                                                $eq: ['$$item.PRODUCT_VOUCHER_ID', '$$voucher._id']
                                                            }
                                                        }
                                                    }, 0]
                                                }
                                            },
                                            in: {
                                                VOUCHER: {
                                                    VOUCHER_CODE: '$$matchedVoucher.VOUCHER_CODE',
                                                    TYPE: '$matchedVoucher.TYPE',
                                                    VALUE: '$$matchedVoucher.VALUE',
                                                    MAX_DISCOUNT: '$$matchedVoucher.MAX_DISCOUNT',        
                                               }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },

            {
                $lookup: {
                    from: 'accounts',
                    localField: 'CUSTOMER_ID',
                    foreignField: 'USER_ID',
                    as: 'CUSTOMER',
                }
            },

            {
                $unwind: {
                    path: '$CUSTOMER',
                    preserveNullAndEmptyArrays: true,
                }
            },

            {
                $lookup: {
                    from: 'accounts',
                    localField: 'SOLD_BY',
                    foreignField: 'USER_ID',
                    as: 'STAFF'
                }
            },

            {
                $unwind: {
                    path: '$STAFF',
                    preserveNullAndEmptyArrays: true,
                }
            },

            {
                $lookup: {
                    from: 'vouchers',
                    localField: 'VOUCHER_GLOBAL_ID',
                    foreignField: '_id',
                    as: 'VOUCHER',
                }
            },

            {
                $unwind: {
                    path: '$VOUCHER',
                    preserveNullAndEmptyArrays: true,
                }
            },

            {
                $project: {
                    _id: 0,
                    INVOICE_CODE: '$INVOICE_CODE',
                    CUSTOMER: '$CUSTOMER.USERNAME',
                    SELL_DATE: '$SELL_DATE',
                    SOLD_BY: '$STAFF.USERNAME',
                    STATUS: '$STATUS',
                    NOTE: '$NOTE',
                    ITEMS: '$ITEMS',
                    TOTAL_AMOUNT: '$TOTAL_AMOUNT',
                    GLOBAL_VOUCHER: {
                        VOUCHER_CODE: '$VOUCHER.VOUCHER_CODE',
                        TYPE: '$VOUCHER.TYPE',
                        VALUE: '$VOUCHER.VALUE',
                        MAX_DISCOUNT: '$VOUCHER.MAX_DISCOUNT'
                    },
                    TAX: '$TAX',
                    EXTRA_FEE: '$EXTRA_FEE',
                    EXTRA_FEE_UNIT: '$EXTRA_FEE_UNIT',
                    EXTRA_FEE_NOTE: '$EXTRA_FEE_NOTE',
                    TOTAL_WITH_TAX_EXTRA_FEE: '$TOTAL_WITH_TAX_EXTRA_FEE',
                    PAYMENT_METHOD: '$PAYMENT_METHOD',
                    PURCHASE_METHOD: '$PURCHASE_METHOD',
                    CREATED_AT: '$CREATED_AT',
                    UPDATED_AT: '$UPDATED_AT'
                }
            }
        ]

        const response = await SalesInvoice.aggregate([
            {
                $match: {
                    _id: invoice._id
                },
            },
            ...pipeline
        ])

        if (invoice.CUSTOMER_ID) {
            const user = await User.findById(invoice.CUSTOMER_ID)
            const contact = authHelper.isValidInfo(user.LIST_CONTACT)
            
            if (!contact) {
                throw new Error("Không thể lấy thông tin người dùng.")
            }

            response[0].CUSTOMER_CONTACT = {
                NAME: contact.FULL_NAME,
                PHONE_NUMBER: contact.PHONE_NUMBER,
                ADDRESS_1: contact.ADDRESS_1,
                ADDRESS_2: contact.ADDRESS_2,
                EMAIL: contact.EMAIL,
                WARD: contact.WARD,
                DISTRICT: contact.DISTRICT,
                CITY: contact.CITY,
                STATE: contact.STATE,
                COUNTRY: contact.COUNTRY,
            }
        }

        if (invoice.SOLD_BY) {
            const user = await User.findById(invoice.SOLD_BY)
            const contact = authHelper.isValidInfo(user.LIST_CONTACT)
            
            if (!contact) {
                throw new Error("Không thể lấy thông tin người dùng.")
            }

            response[0].STAFF_CONTACT = {
                NAME: contact.FULL_NAME,
                PHONE_NUMBER: contact.PHONE_NUMBER,
                ADDRESS_1: contact.ADDRESS_1,
                ADDRESS_2: contact.ADDRESS_2,
                EMAIL: contact.EMAIL,
                WARD: contact.WARD,
                DISTRICT: contact.DISTRICT,
                CITY: contact.CITY,
                STATE: contact.STATE,
                COUNTRY: contact.COUNTRY,
            }
        }

        return response[0]

    } catch (error) {
        console.log(error)
        throw new Error ('Lỗi khi truy xuất hóa đơn')
    }
}

const getAllInvoices = async (query) => {
    try {

        const {page, limit, search, soldBy, customer, fromDate, toDate} = query

        // ép kiểu String thành số
        const pageNumber = Math.max(parseInt(page) || 1, 1);
        const limitNumber = Math.max(parseInt(limit) || 10, 1);
        // tính toán số lượng bản ghi cần bỏ qua
        const skip = page < 2 ? 0 : (pageNumber - 1) * limitNumber;

        const matchConditions = []

        // tạo pipeline join bảng
        const pipeline = [        
            {
                $lookup: {
                    from: 'accounts',            // Tên collection liên kết
                    localField: 'SOLD_BY',       // Trường chứa ObjectId
                    foreignField: 'USER_ID',
                    as: 'STAFF'
                },
                
            },
            { 
                $unwind: {
                    path: '$STAFF',
                    preserveNullAndEmptyArrays: true
                }   // bung mảng thành document
            },

            {
                $lookup: {
                    from: 'accounts',
                    localField: 'CUSTOMER_ID',
                    foreignField: 'USER_ID',
                    as: 'CUSTOMER'
                }
            },

            {
                $unwind: {
                    path: '$CUSTOMER',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]

        if (search?.trim()) {
            console.log(search)
            matchConditions.push({
                $or: [
                    { INVOICE_CODE: { $regex: search, $options: 'i' } },
                    { 'STAFF.USERNAME': { $regex: search, $options: 'i' } },
                    { 'CUSTOMER.USERNAME' : { $regex: search, $option: 'i' } }
                ]
            })
        }

        if (soldBy?.trim()) {
            matchConditions.push({ SOLD_BY: new ObjectId(soldBy) })
        }

        if (customer?.trim()) {
            matchConditions.push({ CUSTOMER_ID: new ObjectId(customer) })
        }

        if (fromDate?.trim()) {

            const startDate = new Date(fromDate)
            startDate.setHours(0,0,0,0)
            console.log(startDate)

            let endDate
            if (toDate?.trim()) {
                endDate = new Date(toDate)
            } else {
                endDate = new Date(fromDate)
            }
            endDate.setHours(23,59,59,999)

            matchConditions.push({
                SELL_DATE: {
                    $gte: startDate,
                    $lte: endDate
                }
            })
        }

        if (matchConditions.length > 0) {
            pipeline.push({ $match: { $and: matchConditions } })
            console.log(matchConditions)
        }

        // tạo pipeline để đếm tổng số bản ghi
        const totalPipeline = [...pipeline]
        totalPipeline.push({ $count: "total" })

        // sắp xếp và phân trang cho pipeline mặc định
        pipeline.push({ 
            $project: {
                _id: 0,
                INVOICE_CODE: "$INVOICE_CODE",
                CUSTOMER: "$CUSTOMER.USERNAME",
                SELL_DATE: "$SELL_DATE",
                SOLD_BY: "$STAFF.USERNAME",
                STATUS: "$STATUS",
                TOTAL_WITH_TAX_EXTRA_FEE: "$TOTAL_WITH_TAX_EXTRA_FEE",
                PAYMENT_METHOD: "$PAYMENT_METHOD",
                PURCHASE_METHOD: "$PURCHASE_METHOD"
            }
        })
        pipeline.push({ $sort: { SELL_DATE: -1 } })
        pipeline.push({ $skip: skip })
        pipeline.push({ $limit: limitNumber })

        console.log(JSON.stringify(pipeline, null, 2));

        const [totalResult, results] = await Promise.all([
            SalesInvoice.aggregate(totalPipeline),
            SalesInvoice.aggregate(pipeline)
        ])

        console.log(results)
                        
        // tổng số bản ghi
        const total = totalResult[0] ?. total || null

        return {
            total,
            page: pageNumber,
            limit: limitNumber,
            results: results
        }

         
    } catch (error) {
        console.log(error.message)
        throw new Error('Lỗi khi lấy danh sách hóa đơn');
    }
    
}

const getInvoiceByCode = async (invoiceCode) => {
    try {
        console.log(invoiceCode)

        const invoice = await SalesInvoice.findOne({INVOICE_CODE: invoiceCode})

        console.log(invoice)

        return await handleInvoiceDataForResponse(invoice)
    } catch (error) {
        throw new Error("Lỗi khi truy vấn dữ liệu hóa đơn.")
    }
}


const updateItemForExporting = async (items, originalItems, backupItems, now) => {

    let totalAmount = 0     // tổng tiền hàng của hóa đơn
    let count = 0           // đếm số lượng các item đã update, hỗ trợ cho rollback không cần phải duyệt những item chưa được update
    const vouchers = []
    const backupVouchers = []

    console.log("originalItems: ", originalItems)
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
                    await invoiceHelper.rollbackItems(count, originalItems, backupItems)
                    console.log("item sold out")
                    return ({error: `Số lượng tồn kho của ${item.ITEM_NAME} không đủ hoặc đã hết hàng.`})
                } 
                
                item.ITEM_STOCKS.QUANTITY -=  addItem.QUANTITY,
                item.ITEM_STOCKS.LAST_UPDATED = now

                if (addItem.PRODUCT_VOUCHER_ID) {
                    const voucher = await Voucher.findById(addItem.PRODUCT_VOUCHER_ID)

                    if (!voucher) {
                        return ({ error: `Voucher cho item ${item.ITEM_NAME} không hợp lệ.` })
                    }

                    backupVouchers.push({...voucher.toObject?.() || voucher})

                    try {
                        await voucherService.updateNumberUsing(voucher)
                        vouchers.push(voucher)
                        
                        const discount = voucher.TYPE === 'PERCENTAGE' ? addItem.TOTAL_PRICE * voucher.VALUE / 100
                                                                        : voucher.VALUE

                        addItem.TOTAL_PRICE = discount < voucher.MAX_DISCOUNT ? addItem.TOTAL_PRICE - discount
                                                                                : addItem.TOTAL_PRICE - voucher.MAX_DISCOUNT

                    } catch (error) {
                        backupVouchers.pop()
                        if (vouchers.length > 0) {
                            await voucherService.rollbackNumberUsing(vouchers, backupVouchers)
                        }
                        
                        throw new Error(error)
                    }
                }

                try {
                    await item.save()
                    totalAmount += addItem.TOTAL_PRICE
                    count++
                    break
                } catch (error) {
                    await invoiceHelper.rollbackItems(count, originalItems, backupItems)
                    await voucherService.rollbackNumberUsing(vouchers, backupVouchers)
  
                    console.log(error.message)
                    throw new Error("Lỗi khi cập nhật số lượng item.")
                }
            }
        }
    }

    return {totalAmount, count, vouchers, backupVouchers, items}
}

const createInvoice = async (data) => {
    const {status, soldBy, customerId, note, items, voucherGlobalId, tax, extraFee, extraFeeUnit, extraFeeNote, paymentMethod, purchaseMethod} = data

    if (status === 'CANCELLED') {
        return { error: `Status ${status} không hợp lệ.`}
    }

    try {
        if(!await Account.findOne({ USER_ID: soldBy })) {
            return {error: "Người dùng không tồn tại."}
        }
        
        // lấy các document item tương ứng
        const {originalItems, backupItems, error} = await (async () => {
            try {
                return invoiceHelper.getItemDocument(items)
            } catch (error) {
                console.log(error)
                throw new Error(error.message)
            }
        })()

        console.log("Original items: ", originalItems)
        console.log("Backup items: ", originalItems)

        if (error) {
            return error
        }

        const now = new Date()

        let count = 0
        let totalAmount = 0
        const vouchers = []
        const backupVouchers = []

        if (status === 'CONFIRMED' || status === 'PAYMENTED') {
            const updatingData = await updateItemForExporting(items, originalItems, backupItems, now)

            console.log(updatingData)

            if (updatingData.errorItemUpdating) {
                return updatingData
            }
            
            count = updatingData.count
            totalAmount = updatingData.totalAmount
            vouchers.push(...updatingData.vouchers)
            backupVouchers.push(...updatingData.backupVouchers)
        }
        
        else {
            for(const addItem of items) {          
                for(const item of originalItems) {

                    if(item.ITEM_CODE === addItem.ITEM_CODE) {

                        const price = authHelper.isValidInfo(item.PRICE)
                        addItem.UNIT = price.get("UNIT")
                        addItem.UNIT_PRICE = price.PRICE_AMOUNT

                        let discount = 0

                        if (addItem.PRODUCT_VOUCHER_ID) {
                            const voucher = await Voucher.findById(addItem.PRODUCT_VOUCHER_ID)
                            if (!voucher) {
                                return ({ error: `Voucher cho item ${item.ITEM_NAME} không hợp lệ.` })
                            }
                            
                            const isAvailable = voucherService.isVoucherAvailable(voucher)
                            if (isAvailable?.error) {
                                return ({ error: isAvailable.error })
                            }

                            if ((addItem.QUANTITY + voucher.NUMBER_USING) > voucher.QUANTITY) {
                                const quantity = addItem.QUANTITY + voucher.NUMBER_USING - voucher.QUANTITY
                                items.splice(items.indexOf(addItem), 0, {
                                    ITEM_CODE: addItem.ITEM_CODE,
                                    UNIT: addItem.UNIT,
                                    UNIT_PRICE: addItem.UNIT_PRICE,
                                    QUANTITY: quantity,
                                    TOTAL_PRICE: addItem.UNIT_PRICE * quantity
                                })
                                addItem.QUANTITY = voucher.QUANTITY - voucher.NUMBER_USING
                            }         
                            
                            discount = price.PRICE_AMOUNT * addItem.QUANTITY * 1
                        }

                        addItem.TOTAL_PRICE = price.PRICE_AMOUNT * addItem.QUANTITY

                        console.log(addItem)

                        totalAmount += addItem.TOTAL_PRICE 
                    }
                }
            }
        }

        console.log("Items: ", items)

        const taxValue = tax ? totalAmount * tax / 100 : 0

        if (status !== 'DRAFT') {
            if (voucherGlobalId) {
                const voucher = await Voucher.findById(voucherGlobalId)

                if (!voucher) {
                    return { error: "Voucher không tồn tại." }
                }

                try {
                    const {updateVoucher} = await voucherService.updateNumberUsing(voucher)
                    if (updateVoucher?.error) {
                        return {error: updateVoucher.error}
                    }

                    else {
                        vouchers.push(voucher)
                        if (voucher.TYPE === 'PERCENTAGE') {
                            const discount = totalAmount * voucher.VALUE / 100

                            totalAmount = discount < voucher.MAX_DISCOUNT ? totalAmount - discount : totalAmount - voucher.MAX_DISCOUNT
                        }

                        else {
                            totalAmount = voucher.VALUE < voucher.MAX_DISCOUNT ? totalAmount - voucher.VALUE  : totalAmount - voucher.MAX_DISCOUNT
                        }

                        totalAmount = totalAmount < 0 ? 0 : totalAmount
                    }
                } catch (error) {
                    if (vouchers.length > 0) {
                        await voucherService.rollbackNumberUsing(vouchers)
                    }
                    
                    throw new Error(error)
                }
            }
        }

        console.log("vouchers: ", vouchers)

        const invoiceData = {
            INVOICE_CODE: now.getTime(),
            CUSTOMER_ID: customerId || null,
            SELL_DATE: now,
            SOLD_BY: soldBy,
            STATUS: status,
            NOTE: note,
            ITEMS: items,
            TOTAL_AMOUNT: totalAmount,
            VOUCHER_GLOBAL_ID: voucherGlobalId,
            TAX: tax,
            EXTRA_FEE: extraFee,
            EXTRA_FEE_UNIT: extraFeeUnit,
            EXTRA_FEE_NOTE: extraFeeNote,
            TOTAL_WITH_TAX_EXTRA_FEE: extraFee ? totalAmount + taxValue + extraFee : totalAmount + taxValue,         
            PAYMENT_METHOD: paymentMethod,
            PURCHASE_METHOD: purchaseMethod,
            CREATED_AT: now,
            UPDATED_AT: null,
        }

        const invoice = await (async () => {
            try {
                const newInvoice = new SalesInvoice(invoiceData)
                return await newInvoice.save()
            } catch (error) {
                if (status === 'CONFIRMED' || status === 'PAYMENTED') {
                    await invoiceHelper.rollbackItems(count, originalItems, backupItems)
                }
                if (vouchers.length > 0) {
                    await voucherService.rollbackNumberUsing(vouchers)
                }
                console.log(error.message)
                return null
            }
        }) ()

        if (!invoice) {
            throw new Error("Lỗi xảy ra khi lưu hóa đơn.")
        }

        return await handleInvoiceDataForResponse(invoice)
    } catch (error) {
        throw new Error(error)
    }
}

const updateInvoiceStatus = async (data) => {
    const {invoiceCode, status} = data
    const now = new Date()
    let count = 0       // đếm document

    const invoice = await SalesInvoice.findOne({ INVOICE_CODE: invoiceCode })

    if(!invoice) {
        return ({error: "Không tìm thấy hóa đơn."})
    }
    if (status === 'DRAFT') {
        return ({error: "Không thể cập nhật trạng thái DRAFT."})
    }
    if (invoice.STATUS === 'PAYMENTED' || invoice.STATUS === 'CANCELLED') {
        return ({error: "Hóa đơn đã đạt trạng thái cuối."})
    }  
    if (invoice.STATUS === 'CONFIRMED' && invoice.STATUS !== 'PAYMENTED') {
        return ({ error: `Không thể chuyển sang trạng thái ${status} cho hóa đơn đã được xác nhận.` })
    }

    try {
        // lấy các document item tương ứng
        const {originalItems, backupItems, error} = await (async () => {
            try {
                return invoiceHelper.getItemDocument(invoice.ITEMS)
            } catch (error) {
                console.log(error)
                throw new Error(error.message)
            }
        })()

        console.log(originalItems)

        if (error) {
            return error
        }

        try {
            if (
                (invoice.STATUS === 'DRAFT') && 
                (status === 'CONFIRMED' || (status === 'PAYMENTED' && invoice.STATUS !== 'CONFIRMED'))
            ) {
                const items = invoice.ITEMS.map(item => ({ ...item.toObject?.() || item}))

                const updateItems = await updateItemForExporting(items, originalItems, backupItems, now)

                if (updateItems.error) {
                    return updateItems
                }

                count = updateItems.count  
                newItems = updateItems.items
                           
            }

            invoice.STATUS = status
            invoice.UPDATED_AT = now
            // invoice.ITEMS = newItems

            const updateInvoice = await invoice.save()
            return await handleInvoiceDataForResponse(updateInvoice)

        } catch (error) {

            await invoiceHelper.rollbackItems(count, originalItems, backupItems)

            console.log(error)
            throw new Error("Lỗi khi cập nhật trạng thái hóa đơn.")
        }
    } catch (error) {
        throw new Error(error)
    }
}

const checkValidVouchers = async (items) => {
    const errorFlag = false

    for (const item of items) {
        if (item.PRODUCT_VOUCHER_ID) {
            const voucher = await Voucher.findById(item.PRODUCT_VOUCHER_ID)
            const isAvailable = voucherService.isVoucherAvailable(voucher)
            if (isAvailable?.error) {
                items.PRODUCT_VOUCHER_ID = null
                errorFlag = true
            }
        }        
    }

    return errorFlag
}

const updateInvoice = async (data) => {

    const {items, invoiceCode} = data

    try {
        const invoice = await SalesInvoice.findOne({ INVOICE_CODE: invoiceCode })

        if (invoice.STATUS !== 'DRAFT') {
            return {error: `Không thể cập nhật hóa đơn ở trạng thái ${invoice.STATUS}`}
        }

        const itemCodes = items.map(item => item.ITEM_CODE)
        const originalItems = await Item.find({ ITEM_CODE: { $in: itemCodes } })

        for(const newItem of items) {          
        
            for(const item of originalItems) {

                if(item.ITEM_CODE === newItem.ITEM_CODE) {

                    const price = authHelper.isValidInfo(item.PRICE)
                    newItem.UNIT = price.get("UNIT")
                    newItem.UNIT_PRICE = price.PRICE_AMOUNT

                    if (newItem.PRODUCT_VOUCHER_ID) {
                        const voucher = await Voucher.findById(newItem.PRODUCT_VOUCHER_ID)

                        if (!voucher) {
                            return ({ error: `Voucher cho item ${item.ITEM_NAME} không hợp lệ.` })
                        }
                    }

                    newItem.TOTAL_PRICE = price.PRICE_AMOUNT * newItem.QUANTITY

                    console.log(newItem)

                    totalAmount += newItem.TOTAL_PRICE 
                }
            }
        }
    } catch (error) {
        console.log(error)
        throw new Error ("Lỗi xảy ra trong quá trình cập nhật hóa đơn.")
    }
}

const deleteItem = async (data) => {
    const {items, invoiceCode} = data
    
    try {           
        if (Array.isArray(items)) {
            const invoice = await SalesInvoice.findOneAndUpdate(
                { INVOICE_CODE: invoiceCode },
                { ITEMS: items },
                { new: true  }  
            )

            await invoice.save()
        }

        else {
            const invoice = await SalesInvoice.findOne({ INVOICE_CODE: invoiceCode })
            for(let i=0; i < invoice.ITEMS.length; i++) {
                if (invoice[i].ITEM_CODE === items.ITEM_CODE) {
                    invoice.ITEMS.splice(index, 1)  // xóa phần tử trong mở theo index
                    break
                }
            }
            await invoice.save()
        }

    } catch (error) {
        console.log(error)
        throw new Error ("Lỗi xảy ra khi xóa item(s) trong hóa đơn.")
    }
}

module.exports = {
    getAllInvoices,
    getInvoiceByCode,
    createInvoice,
    updateInvoiceStatus,
    updateInvoice,
    deleteItem,
}