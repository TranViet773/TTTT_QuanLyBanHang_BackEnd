const SalesInvoices = require('../models/SalesInvoices.model')
const Account = require('../models/Account.model')
const User = require('../models/User.model')
const Voucher = require('../models/Voucher.model')
const authHelper = require('../helpers/auth.helper')
const invoiceHelper = require('../helpers/invoice.helper')
const voucherHelper = require('../helpers/voucher.helper')


const handleInvoiceDataForResponse = async (invoice) => {
    console.log(invoice)

    try {
        const pipeline = [
            {
                $lookup: {
                    from: "items",
                    localFields: 'ITEMS.ITEM_CODE',
                    foreignFields: 'ITEM_CODE',
                    as: 'ITEM_DETAILS'
                },
            },

            {
                $lookup: {
                    from: 'unit_invoices',
                    localFields: 'ITEMS.UNIT',
                    foreignFields: '_id',
                    as: 'ITEM_UNIT_INVOICES'
                }
            },

            {
                $lookup: {
                    from: 'vouchers',
                    localFields: 'ITEMS.PRODUCT_VOUCHER_ID',
                    foreignFields: '_id',
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
                                            $var: {
                                                matchedItem: {
                                                    $arrayElemAt: [{
                                                        $filter: {
                                                            input: "$ITEM_DETAIL",
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
                                                    ITEM_NAME: "$matchedItem.ITEM_NAME",
                                                    ITEM_NAME_EN: '$matchedItem.ITEM_NAME_EN',
                                                    AVATAR_IMG_URL: '$matchedItem.AVATAR_IMG_URL',
                                                }
                                            }
                                        }                                        
                                    },

                                    {
                                        $let: {
                                            $var: {
                                                matchUnit: {
                                                    $arrayElemAt: [{
                                                        $filter: {
                                                            input: 'ITEM_UNIT_INVOICES',
                                                            as: 'unit',
                                                            cond: {
                                                                $eq: ['$$item.UNIT', '$$unit._id']
                                                            }
                                                        }
                                                    }, 0]
                                                }
                                            },

                                            $in: {
                                                UNIT: {
                                                    UNIT_NAME: '$matchedUnit.UNIT_NAME',
                                                    UNIT_NAME_EN: '$matchedUnit.UNIT_NAME_EN',
                                                    UNIT_ABB: '$matchedUnit.UNIT_ABB',
                                                }
                                            }
                                        }                                     
                                    },

                                    {
                                        $let: {
                                            $var: {
                                                matchVoucher: {
                                                    $arrayElemAt: [{
                                                        $filter: {
                                                            input: 'ITEM_VOUCHERS',
                                                            as: 'voucher',
                                                            cond: {
                                                                $eq: ['$$item.PRODUCT_VOUCHER_ID', '$$voucher._id']
                                                            }
                                                        }
                                                    }, 0]
                                                }
                                            },
                                            $in: {
                                                VOUCHER: {
                                                    VOUCHER_CODE: '$matchedVoucher.VOUCHER_CODE',
                                                    VALUE: '$matchedVoucher.VALUE',
                                                    MAX_DISCOUNT: '$matchedVoucher.MAX_DISCOUNT',        
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
                    localFields: 'CUSTOMER_ID',
                    foreignFields: 'USER_ID',
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
                    localFields: 'SOLD_BY',
                    foreignFields: 'USER_ID',
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
                    localFields: 'VOUCHER_GLOBAL_ID',
                    foreignFields: '_id',
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
                    SOLD_BY: '$STAFF',
                    STATUS: '$STATUS',
                    NOTE: '$NOTE',
                    ITEMS: '$ITEMS',
                    TOTAL_AMOUNT: '$TOTAL_AMOUNT',
                    GLOBAL_VOUCHER: '$VOUCHER',
                    TAX: '$TAX',
                    EXTRA_FEE: '$EXTRA_FEE',
                    EXTRA_FEE_UNIT: '$EXTRA_FEE_UNIT',
                    EXTRA_FEE_NOTE: '$EXTRA_FEE_NOTE',
                    TOTAL_WITH_TAX_EXTRA_FEE: '$TOTAL_WITH_TAX_EXTRA_FEE',
                    PAYMENT_STATUS: '$PAYMENT_STATUS',
                    PURCHASE_METHOD: '$PURCHASE_METHOD',
                    CREATED_AT: '$CREATED_AT',
                    UPDATED_AT: '$UPDATED_AT'
                }
            }
        ]

        const response = await SalesInvoices.aggregate([
            {
                $match: {
                    _id: invoice.INVOICE_CODE
                },
                ...pipeline
            }
        ])

        if (invoice.CUSTOMER_ID) {
            const user = await User.findById(invoice.CUSTOMER_ID)
            const contact = authHelper.isValidInfo(user.LIST_CONTACT)
            
            if (!contact) {
                throw new Error("Không thể lấy thông tin người dùng.")
            }

            response[0].USER_CONTACT = {
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
                SOLD_BY: "$ACCOUNT.USERNAME",
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
            PurchaseInvoice.aggregate(totalPipeline),
            PurchaseInvoice.aggregate(pipeline)
        ])

        console.log(results)

        // const results = await PurchaseInvoicesModel.aggregate(pipeline)
                        
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
        const invoice = await SalesPurchase.findOne({INVOICE_CODE: invoiceCode})

        console.log(invoice)

        return await handleInvoiceDataForResponse(invoice)
    } catch (error) {
        throw new Error("Lỗi khi truy vấn dữ liệu hóa đơn.")
    }
}


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
                    invoiceHelper.rollbackItems(count, originalItems, backupItems)
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
                    invoiceHelper.rollbackItems(count, originalItems, backupItems)
                    console.log(error.message)
                    throw new Error("Lỗi khi cập nhật số lượng item.")
                }
            }
        }
    }

    return {totalAmount, count}
}

const createInvoice = async (data) => {
    const {soldBy, status, note, items, voucherGlobalId, tax, extraFee, extraFeeUnit, extraFeeNote, paymentMethod, purchaseMethod} = data


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

        console.log(originalItems)

        if (error) {
            return error
        }

        const now = new Date()

        let count = 0
        let totalAmount = 0

        if (status === 'CONFIRMED' || status === 'PAYMENTED') {
            const updatingData = await updateItemForExporting(items, originalItems, backupItems, now)

            console.log(updatingData)

            if (updatingData.errorItemUpdating) {
                return updatingData
            }
            
            count = updatingData.count
            totalAmount = updatingData.totalAmount
        }
        
        else {
            for(const addItem of items) {          

                for(const item of originalItems) {

                    if(item.ITEM_CODE === addItem.ITEM_CODE) {

                        const price = authHelper.isValidInfo(item.PRICE)
                        addItem.UNIT = price.get("UNIT")
                        addItem.UNIT_PRICE = price.PRICE_AMOUNT

                        if (addItem.PRODUCT_VOUCHER_ID) {
                            const voucher = await Voucher.findById(addItem.PRODUCT_VOUCHER_ID)

                            if (!voucher) {
                                return ({ error: `Voucher cho item ${item.ITEM_NAME} không hợp lệ.` })
                            }

                            if ()
                        }

                        addItem.TOTAL_PRICE = price.PRICE_AMOUNT * addItem.QUANTITY

                        console.log(addItem)

                        totalAmount += addItem.TOTAL_PRICE 
                    }
                }
            }
        }

        const invoiceData = {
            INVOICE_CODE: now.getTime(),
            IMPORT_DATE: now,
            IMPORTED_BY: importedBy,
            STATUS: [
                {
                    STATUS_NAME: statusName,
                    FROM_DATE: now,
                    THRU_DATE: null,
                }
            ],
            TOTAL_AMOUNT: totalAmount,
            EXTRA_FEE: extraFee,
            EXTRA_FEE_UNIT: extraFeeUnit,
            EXTRA_FEE_NOTE: extraFeeNote,
            TAX: tax,
            TOTAL_WITH_TAX_EXTRA_FEE: tax && extraFee ? totalAmount + totalAmount * (tax/100)  + extraFee :
                                        tax && !extraFee ? totalAmount + totalAmount * (tax/100) :
                                        !tax && extraFee ? totalAmount + extraFee : totalAmount,
            ITEMS: items,
            PAYMENTED: paymented
        }

        const invoice = await (async () => {
            try {
                return await (new PurchaseInvoice(invoiceData)).save()
            } catch (error) {
                if (statusName === 'CONFIRMED' || statusName === 'PAYMENTED') {
                    invoiceHelper.rollbackItems(count, originalItems, backupItems)
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

module.exports = {
    getAllInvoices,
    getInvoiceByCode,

}