const SalesInvoice = require('../models/SalesInvoices.model')
const Account = require('../models/Account.model')
const User = require('../models/User.model')
const Item = require('../models/Item.model')
const Voucher = require('../models/Vouchers.model')
const voucherService = require('../services/voucher.service')
const authHelper = require('../helpers/auth.helper')
const invoiceHelper = require('../helpers/invoice.helper')
const { ObjectId } = require('mongodb')
const _ = require('lodash')



const handleInvoiceDataForResponse = async (invoice) => {
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
                                                                $eq: ['$$item.ITEM_CODE', '$$item_detail.ITEM_CODE'],
                                                            }
                                                        }
                                                    }, 0]
                                                }
                                            },
                                            in: {
                                                ITEM_DETAIL: {
                                                    ITEM_NAME: "$$matchedItem.ITEM_NAME",
                                                    ITEM_NAME_EN: '$$matchedItem.ITEM_NAME_EN',
                                                    AVATAR_IMAGE_URL: '$$matchedItem.AVATAR_IMAGE_URL',
                                                    ITEM_TYPE: '$$matchedItem.ITEM_TYPE',
                                                    IS_ACTIVE: '$$matchedItem.IS_ACTIVE',
                                                    LIST_VOUCHER_ACTIVE: '$$matchedItem.LIST_VOUCHER_ACTIVE',
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
                                                    _id: '$$matchedVoucher._id',
                                                    VOUCHER_CODE: '$$matchedVoucher.VOUCHER_CODE',
                                                    TYPE: '$$matchedVoucher.TYPE',
                                                    VALUE: '$$matchedVoucher.VALUE',
                                                    // QUANTITY: '$$matchedVoucher.QUANTITY',
                                                    // NUMBER_USING: '$$matchedVoucher.NUMBER_USING',
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
                    from: 'vouchers',
                    localField: 'ITEMS.ITEM_DETAIL.LIST_VOUCHER_ACTIVE',
                    foreignField: '_id',
                    as: 'LIST_VOUCHER_ACTIVE',
                }
            },
            {
                $lookup: {
                    from: 'item_types',
                    localField: 'ITEMS.ITEM_DETAIL.ITEM_TYPE',
                    foreignField: '_id',
                    as: 'LIST_ITEM_TYPE'
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
                    localField: 'CREATED_BY_USER',
                    foreignField: 'USER_ID',
                    as: 'CREATED_BY'
                }
            },

            {
                $unwind: {
                    path: '$CREATED_BY',
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
                $unset: [
                    'ITEMS.PRODUCT_VOUCHER_ID'
                ]
            },
            {
                $project: {
                    _id: 0,
                    INVOICE_CODE: '$INVOICE_CODE',
                    CREATED_BY: '$CREATED_BY.USERNAME',
                    CUSTOMER: '$CUSTOMER.USERNAME',
                    SELL_DATE: '$SELL_DATE',
                    SOLD_BY: '$STAFF.USERNAME',
                    STATUS: '$STATUS',
                    DELIVERY_INFORMATION: '$DELIVERY_INFORMATION',
                    NOTE: '$NOTE',
                    ITEMS: '$ITEMS',
                    TOTAL_AMOUNT: '$TOTAL_AMOUNT',
                    GLOBAL_VOUCHER: {
                        _id: '$VOUCHER._id',
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
                    UPDATED_AT: '$UPDATED_AT',
                    LIST_VOUCHER_ACTIVE: '$LIST_VOUCHER_ACTIVE',
                    LIST_ITEM_TYPE: '$LIST_ITEM_TYPE',
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

        const listVoucher = response[0].LIST_VOUCHER_ACTIVE
        const listItemType = response[0].LIST_ITEM_TYPE

        if(listVoucher){
            for (let i = 0; i < response[0].ITEMS.length; i++) {
                const item = response[0].ITEMS[i]

                const detail = item.ITEM_DETAIL

                const vouchers = detail.LIST_VOUCHER_ACTIVE

                if (vouchers && vouchers.length > 0) {
                    for (let j = 0; j < vouchers.length; j++) {
                        
                        for (const voucherDetail of listVoucher) {
                            if (voucherDetail._id.equals(vouchers[j])
                                // voucherDetail.IS_ACTIVE === true &&
                                // new Date(voucherDetail.START_DATE) <= now &&
                                // new Date(voucherDetail.END_DATE) >= now &&
                                // voucherDetail.NUMBER_USING < voucherDetail.QUANTITY
                            ) {
                                vouchers[j] = voucherDetail                               
                                break
                            }

                            // else {
                            //     vouchers.splice(j, 1)    
                            // }
                            
                        }
                    }
                }

                const itemType = detail.ITEM_TYPE
                for (const type of listItemType) {
                    if (detail.ITEM_TYPE.equals(type._id)) {
                        detail.ITEM_TYPE_NAME = type.ITEM_TYPE_NAME
                    }
                }

                for(const key of Object.keys(detail)) {
                    item[key] = detail[key]
                }

                delete item.ITEM_DETAIL
            }
        }
        else console.log("null")    
        

        delete response[0].LIST_VOUCHER_ACTIVE
        delete response[0].LIST_ITEM_TYPE

        if (invoice.CUSTOMER_ID) {
            const user = await User.findById(invoice.CUSTOMER_ID)
            const contact = authHelper.isValidInfo(user.LIST_CONTACT)
            
            if (!contact) {
                throw new Error("Không thể lấy thông tin người dùng.")
            }

            response[0].CUSTOMER_CONTACT = {
                _id: invoice.CUSTOMER_ID,
                USERNAME: response[0].CUSTOMER,
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

            delete response[0].CUSTOMER
        }

        if (invoice.SOLD_BY) {
            const user = await User.findById(invoice.SOLD_BY)
            const contact = authHelper.isValidInfo(user.LIST_CONTACT)
            
            if (!contact) {
                throw new Error("Không thể lấy thông tin người dùng.")
            }

            response[0].STAFF_CONTACT = {
                _id: invoice.SOLD_BY,
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
                ROLE: {
                    IS_ADMIN: user.ROLE.IS_ADMIN,
                    IS_MANAGER: user.ROLE.IS_MANAGER,
                    IS_SERVICE_STAFF: user.ROLE.IS_SERVICE_STAFF,
                    IS_CUSTOMER: user.ROLE.IS_CUSTOMER
                }
            }
        }

        return response[0]

    } catch (error) {
        console.log(error)
        throw new Error ('Lỗi khi truy xuất hóa đơn')
    }
}

const getAllInvoices = async (query, user) => {
    try {

        const {page, limits, search, status, buyer, seller, invoiceCode,
                minPrice, maxPrice, fromDate, toDate, purchaseMethod} = query

        // ép kiểu String thành số
        const pageNumber = Math.max(parseInt(page) || 1, 1);
        const limitNumber = Math.max(parseInt(limits) || 10, 1);
        // tính toán số lượng bản ghi cần bỏ qua
        const skip = page < 2 ? 0 : (pageNumber - 1) * limitNumber;

        const matchConditions = []
        const now = new Date()

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
                    localField: 'CREATED_BY_USER',
                    foreignField: 'USER_ID',
                    as: 'CREATED_BY'
                }
            },

            {
                $unwind: {
                    path: '$CREATED_BY',
                    preserveNullAndEmptyArrays: true
                }
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
            },

            {             
                $lookup: {
                    from: "users",
                    let: { 
                        userId: "$CUSTOMER_ID",
                        now: now,
                     },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$userId"] },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "CUSTOMER_INFO"
                }
            },

            {
                $unwind: {
                    path: '$CUSTOMER_INFO',
                    preserveNullAndEmptyArrays: true,
                }
            },
        ]

        if (search?.trim()) {
            console.log(search)
            if (seller?.trim() && seller === true) {
                matchConditions.push({ 'STAFF.USERNAME': { $regex: seller, $options: 'i' } },)
            }

            else if (buyer?.trim() && buyer === true) {
                matchConditions.push({ 'CUSTOMER.USERNAME': { $regex: buyer, $options: 'i' } },)
            }

            else if (invoiceCode?.trim() && invoiceCode === true) {
                matchConditions.push({ INVOICE_CODE: { $regex: search, $options: 'i' } })
            }

            else matchConditions.push({
                $or: [
                    { INVOICE_CODE: { $regex: search, $options: 'i' } },
                    { 'STAFF.USERNAME': { $regex: search, $options: 'i' } },
                    { 'CUSTOMER.USERNAME' : { $regex: search, $options: 'i' } }
                ]
            })
        }

        if (status?.trim()) {
            matchConditions.push({ STATUS: { $regex: status, $options: 'i' }})
        }

        if (fromDate?.trim()) {
            const startDate = new Date(fromDate)
            startDate.setHours(0,0,0,0)

            if (toDate?.trim()) {
                const endDate = new Date(toDate)
                endDate.setHours(23,59,59,999)

                matchConditions.push({
                    SELL_DATE: {
                        $gte: startDate,
                        $lte: endDate
                    } 
                })
            } else {
                matchConditions.push({
                    SELL_DATE: {
                        $gte: startDate
                    }
                })
            }
        }

        else {
            if (toDate?.trim()) {
                const endDate = new Date(toDate)
                endDate.setHours(23,59,59,999)

                matchConditions.push({
                    SELL_DATE: {
                        $lte: endDate
                    }
                })
            }
        }

        if (minPrice?.trim()) {

            if (maxPrice?.trim()) {
                matchConditions.push({
                    TOTAL_WITH_TAX_EXTRA_FEE: {
                        $gte: Number(minPrice),
                        $lte: Number(maxPrice),
                    } 
                })
            } else {
                matchConditions.push({
                    TOTAL_WITH_TAX_EXTRA_FEE: {
                        $gte: Number(minPrice)
                    }
                })
            }
        }

        else {
            if (maxPrice?.trim()) {
                matchConditions.push({
                    TOTAL_WITH_TAX_EXTRA_FEE: {
                        $lte: Number(maxPrice)
                    }
                })
            }
        }

        if (purchaseMethod?.trim()) {
            matchConditions.push({ PURCHASE_METHOD: { $regex: purchaseMethod, $options: 'i' }})
        }

        if (user.IS_CUSTOMER) {
            matchConditions.push({
                CREATED_BY_USER: new ObjectId(user.USER_ID)
            })
        }

        if (matchConditions.length > 0) {
            pipeline.push({ $match: { $and: matchConditions } })
            // console.log(matchConditions)
        }

        // tạo pipeline để đếm tổng số bản ghi
        const totalPipeline = [...pipeline]
        totalPipeline.push({ $count: "total" })

        // sắp xếp và phân trang cho pipeline mặc định
        pipeline.push({ 
            $project: {
                _id: 0,
                INVOICE_CODE: "$INVOICE_CODE",
                CREATED_BY_USER: "$CREATED_BY.USERNAME",
                CUSTOMER: {
                    USERNAME: "$CUSTOMER.USERNAME",
                    // EMAIL: "$CUSTOMER"
                },
                SELL_DATE: "$SELL_DATE",
                SOLD_BY: "$STAFF.USERNAME",
                STATUS: "$STATUS",
                TOTAL_WITH_TAX_EXTRA_FEE: "$TOTAL_WITH_TAX_EXTRA_FEE",
                PAYMENT_METHOD: "$PAYMENT_METHOD",
                PURCHASE_METHOD: "$PURCHASE_METHOD",
                CUSTOMER_INFO: "$CUSTOMER_INFO",
                // CONTACT_INFO: "$CONTACT_INFO"
            }
        })
        pipeline.push({ $sort: { SELL_DATE: -1 } })
        pipeline.push({ $skip: skip })
        pipeline.push({ $limit: limitNumber > 50 ? 50 : limitNumber })

        console.log(JSON.stringify(pipeline, null, 2));

        const [totalResult, results] = await Promise.all([
            SalesInvoice.aggregate(totalPipeline),
            SalesInvoice.aggregate(pipeline)
        ])
        // tổng số bản ghi
        const total = totalResult[0] ?. total || null

        // Lấy ra thông tin cơ bản của khách hàng
        for (let i=0; i < results.length; i++) {
            if (!results[i].CUSTOMER_INFO) {
                continue
            }

           
            const info = results[i].CUSTOMER_INFO
            const listContact = info.LIST_CONTACT            
            console.log(listContact)
            const contact = authHelper.isValidInfo(listContact)

            results[i].CUSTOMER.FULL_NAME = contact?.FULL_NAME
            results[i].CUSTOMER.EMAIL = contact?.EMAIL
            results[i].CUSTOMER.PHONE_NUMBER = contact?.PHONE_NUMBER
            
            delete results[i].CUSTOMER_INFO
        }

        return {
            total,
            page: pageNumber,
            limits: limitNumber,
            results: results
        }

         
    } catch (error) {
        console.log(error.message)
        throw new Error('Lỗi khi lấy danh sách hóa đơn');
    }
    
}

const getInvoiceByCode = async (invoiceCode, user) => {
    try {

        const invoice = await SalesInvoice.findOne({INVOICE_CODE: invoiceCode})
        if (user?.IS_CUSTOMER && invoice.CUSTOMER_ID?.toString() !== user?.USER_ID) {
            return {error: `Không tìm thấy hoặc không có quyền truy cập vào hóa đơn ${invoiceCode}`}
        }

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
    let flag = false

    for(const addItem of items) {

        if (flag === true) {
            flag = false
            continue
        }

        for(const item of originalItems) {

            if(item.ITEM_CODE === addItem.ITEM_CODE) {

                const price = authHelper.isValidInfo(item.PRICE)
                addItem.UNIT = price.UNIT
                addItem.UNIT_PRICE = price.PRICE_AMOUNT
                addItem.TOTAL_PRICE = price.PRICE_AMOUNT * addItem.QUANTITY
                addItem.SUPPLIER_ID = null

                // Kiểm tra item is_active
                if (!item.IS_ACTIVE) {
                    await invoiceHelper.rollbackItems(count, originalItems, backupItems)

                    return ({
                        // khi lỗi sẽ trả về tất cả dữ liệu (để thực hiện rollback) kèm error
                        totalAmount, count, vouchers, backupVouchers, items,
                        error: `Item ${item.ITEM_NAME} đã ngừng kinh doanh.`
                    })
                }

                // Kiểm tra số lượng tồn kho của item
                if (item.ITEM_STOCKS.QUANTITY < addItem.QUANTITY) {
                    await invoiceHelper.rollbackItems(count, originalItems, backupItems)

                    return ({
                        // khi lỗi sẽ trả về tất cả dữ liệu (để thực hiện rollback) kèm error
                        totalAmount, count, vouchers, backupVouchers, items,
                        error: `Số lượng tồn kho của ${item.ITEM_NAME} không đủ hoặc đã hết hàng.`
                    })
                } 
                
                // cập nhật số lượng và thời gian update
                item.ITEM_STOCKS.QUANTITY -=  addItem.QUANTITY,
                item.ITEM_STOCKS.LAST_UPDATED = now

                if (addItem.PRODUCT_VOUCHER_ID) {
                    const voucher = await Voucher.findById(addItem.PRODUCT_VOUCHER_ID)

                    if (!voucher) {
                        return ({ 
                            totalAmount, count, vouchers, backupVouchers, items,
                            error: `Voucher cho item ${item.ITEM_NAME} không hợp lệ.` 
                        })
                    }

                    // kiểm tra phạm vi sử dụng của voucher
                    if (voucher.APPLY_SCOPE !== 'PRODUCT') {
                        return { 
                            totalAmount, count, vouchers, backupVouchers, items,
                            error: `Phạm vi áp dụng của voucher ${voucher.VOUCHER_CODE} không hợp lệ.` 
                        }
                    }

                    // nếu voucher hợp lệ thì push vào backup để rollback dữ liệu nếu xảy ra lỗi
                    backupVouchers.push({...voucher.toObject?.() || voucher})

                    try {
                        const updatingVoucher = await voucherService.updateNumberUsing(voucher, addItem.QUANTITY)
                        if (updatingVoucher.error) {
                            return {
                                totalAmount, count, vouchers, backupVouchers, items,
                                error: updatingVoucher.error
                            }
                        }

                        // push voucher đã được cập nhật vào mảng (để rollback nếu lỗi)
                        vouchers.push(voucher)

                        // nếu số lượng mua lớn hơn lượng voucher còn khả dụng
                        if (updatingVoucher.outOfVoucher > 0) {

                            const quantity = updatingVoucher.outOfVoucher
                            // thêm item mới vào trước item hiện tại (để không duyệt lại) 
                            items.splice(items.indexOf(addItem), 0, {
                                ITEM_CODE: addItem.ITEM_CODE,
                                UNIT: addItem.UNIT,
                                UNIT_PRICE: addItem.UNIT_PRICE,
                                QUANTITY: quantity,
                                TOTAL_PRICE: addItem.UNIT_PRICE * quantity
                            })
                            
                            // đặt cờ để vòng lặp bỏ qua phần tử kế tiếp (là item hiện tại đang được duyệt)
                            flag = true

                            // cập nhật lại tổng tiền với item đã thêm mới
                            totalAmount += addItem.UNIT_PRICE * quantity

                            // cập nhật lại số lượng của item hiện tại
                            addItem.QUANTITY -= updatingVoucher.outOfVoucher
                            // cập nhật lại giá
                            addItem.TOTAL_PRICE = price.PRICE_AMOUNT * addItem.QUANTITY
                        }

                        const discount = voucher.TYPE === 'PERCENTAGE' ? addItem.UNIT_PRICE * voucher.VALUE / 100
                                                                        : voucher.VALUE

                        addItem.TOTAL_PRICE = voucher.MAX_DISCOUNT && discount < voucher.MAX_DISCOUNT ? 
                                                    addItem.TOTAL_PRICE - (discount * addItem.QUANTITY) : 
                                                    addItem.TOTAL_PRICE - (voucher.MAX_DISCOUNT * addItem.QUANTITY)

                        // addItem.TOTAL_PRICE = addItem.TOTAL_PRICE < 0 ? 0 : addItem.TOTAL_AMOUNT 

                    } catch (error) {
                        backupVouchers.pop()
                        if (vouchers.length > 0) {
                            await voucherService.rollbackNumberUsing(vouchers, backupVouchers)
                        }

                        console.log(error)
                        
                        throw new Error(error)
                    }
                }

                try {
                    await item.save()
                    totalAmount = addItem.TOTAL_PRICE < 0 ? totalAmount : totalAmount + addItem.TOTAL_PRICE
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

const updateInvoiceItems = async (items, originalItems) => {
    let loopFlag = false
    let totalAmount = 0
    for(const addItem of items) {   
        if (loopFlag) {
            loopFlag = true
            continue
        }

        for(const item of originalItems) {

            if(item.ITEM_CODE === addItem.ITEM_CODE) {

                if (!item.IS_ACTIVE) {
                    return {error: `Item ${item.ITEM_NAME} đã ngừng kinh doanh.`}
                }

                 // Kiểm tra số lượng tồn kho của item
                if (item.ITEM_STOCKS.QUANTITY < addItem.QUANTITY) {
                    return ({
                        error: `Số lượng tồn kho của ${item.ITEM_NAME} không đủ hoặc đã hết hàng.`
                    })
                } 

                // thêm trường giá bán vào item trong hóa đơn
                const price = authHelper.isValidInfo(item.PRICE)
                addItem.UNIT = price.UNIT
                addItem.UNIT_PRICE = price.PRICE_AMOUNT

                let discount = 0

                // kiểm tra sản phẩm có giảm giá
                if (addItem.PRODUCT_VOUCHER_ID) {
                    const voucher = await Voucher.findById(addItem.PRODUCT_VOUCHER_ID)

                    if (!voucher) {
                        return ({ error: `Voucher cho item ${item.ITEM_NAME} không hợp lệ.` })
                    }
                    
                    if (voucher.APPLY_SCOPE !== 'PRODUCT') {
                        return ({ error: `Phạm vi áp dụng của voucher ${voucher.VOUCHER_CODE} không hợp lệ.` })
                    }

                    // kiểm tra voucher còn khả dụng
                    const isAvailable = voucherService.isVoucherAvailable(voucher)
                    if (isAvailable?.error) {
                        return ({ error: isAvailable.error })
                    }

                    // nếu số lượng voucher còn khả dụng > số lượng mua của item
                    // thêm mới item với số lượng bằng số lượng item bị thiếu voucher
                    // chỉ để test các api, FE sẽ luôn gửi về dữ liệu đúng
                    if ((addItem.QUANTITY + voucher.NUMBER_USING) > voucher.QUANTITY) {
                        const quantity = addItem.QUANTITY + voucher.NUMBER_USING - voucher.QUANTITY
                        
                        // thêm item mới vào trước item hiện tại (để không duyệt lại) 
                        items.splice(items.indexOf(addItem), 0, {
                            ITEM_CODE: addItem.ITEM_CODE,
                            UNIT: addItem.UNIT,
                            UNIT_PRICE: addItem.UNIT_PRICE,
                            QUANTITY: quantity,
                            TOTAL_PRICE: addItem.UNIT_PRICE * quantity
                        })
                        
                        // cập nhật lại tổng tiền với item đã thêm mới
                        totalAmount += addItem.UNIT_PRICE * quantity

                        // cập nhật lại số lượng của item hiện tại
                        addItem.QUANTITY -=quantity

                        // đặt cờ để bỏ qua item kế tiếp trong vòng lặp (tức item hiện tại sau khi thêm item bị thiếu voucher vào mảng)
                        loopFlag = true

                    }         
                    
                    // nếu voucher thuộc loại phần trăm (PERCENTAGE)
                    if (voucher.TYPE === 'PERCENTAGE') {
                        discount = price.PRICE_AMOUNT * voucher.VALUE / 100
                    }

                    // nếu voucher thuộc loại FIXED_AMOUNT
                    else {
                        discount = voucher.VALUE
                    }

                    discount = voucher.MAX_DISCOUNT && discount > voucher.MAX_DISCOUNT ? voucher.MAX_DISCOUNT : discount
                }

                // cập nhật tổng tiền cho item hiện tại với số tiền được giảm (nếu có)
                addItem.TOTAL_PRICE = (price.PRICE_AMOUNT * addItem.QUANTITY) - (discount * addItem.QUANTITY)

                // cập nhật lại tổng hóa đơn
                totalAmount = addItem.TOTAL_PRICE < 0 ? totalAmount : totalAmount + addItem.TOTAL_PRICE

                break
            }
        }
    }
    return totalAmount
}

const createInvoice = async (data) => {
    const {status, soldBy, customerId, createdBy, note, items, voucherGlobalId, 
            tax, extraFee, extraFeeUnit, extraFeeNote, paymentMethod, purchaseMethod,
            name, country, city, district, ward, detail, phoneNumber, email} = data
    
    if (!status || !items || !paymentMethod || !purchaseMethod) {
        return {error: "Vui lòng nhập đầy đủ thông tin cần thiết cho hóa đơn."}
    }

    if (status === 'CANCELLED') {
        return { error: `Status ${status} không hợp lệ.`}
    }

    if (purchaseMethod === 'ONLINE' || purchaseMethod === 'DELIVERY' || purchaseMethod === 'PRE_ORDER') {
        if (!name || !country || !city || !district || !ward || !phoneNumber) {
            return { error: 'Vui lòng nhập đầy đủ thông tin đặt hàng.' }
        }
    }

    try {

        if(soldBy && !await Account.findOne({ USER_ID: soldBy })) {
            return { error: "Nhân viên không tồn tại." }
        }

        if (customerId && !await Account.findOne({ USER_ID: customerId })) {
            return { error: "Khách hàng không tồn tại." }
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

        if (error) {
            return error
        }

        const now = new Date()

        let count = 0
        let totalAmount = 0
        const vouchers = []
        const backupVouchers = []


        // tạo hóa đơn trực tiếp
        if (status === 'CONFIRMED' || status === 'PAYMENTED' || purchaseMethod === 'ONLINE') {

            // Update số lượng item
            const updatingData = await updateItemForExporting(items, originalItems, backupItems, now)
            
            if (updatingData.error) {
                if (updatingData.count > 0) {
                    await invoiceHelper.rollbackItems(updatingData.count, originalItems, backupItems)
                }
                
                if (updatingData.vouchers?.length > 0) {
                    await voucherService.rollbackNumberUsing(updatingData.vouchers, updatingData.backupVouchers)
                }
                return updatingData
            }

            // update tổng tiền
            totalAmount = updatingData.totalAmount
            
            // backup dữ liệu
            count = updatingData.count
            vouchers.push(...updatingData.vouchers)
            backupVouchers.push(...updatingData.backupVouchers)
        }
        
        else {
            totalAmount = await updateInvoiceItems(items, originalItems)

            if (totalAmount?.error) {
                return totalAmount
            }
        }

        // tính thuế
        const taxValue = tax ? (totalAmount * tax / 100) : 0

        // kiểm tra voucher toàn hóa đơn
        if (voucherGlobalId) {
            const voucher = await Voucher.findById(voucherGlobalId)
            if (!voucher) {
                return { error: "Voucher không tồn tại." }
            }

            if (voucher.APPLY_SCOPE !== 'GLOBAL') {
                return { error: `Phạm vi áp dụng của voucher ${voucher.VOUCHER_CODE} không hợp lệ.` }
            }

            const isAvailable = voucherService.isVoucherAvailable(voucher)
            if (isAvailable?.error) {
                return ({ error: isAvailable.error })
            }

            // cập nhật tổng tiền với số tiền được giảm
            if (voucher.TYPE === 'PERCENTAGE') {
                const discount = totalAmount * voucher.VALUE / 100

                totalAmount = discount < voucher.MAX_DISCOUNT ? totalAmount - discount : totalAmount - voucher.MAX_DISCOUNT
            }

            else {
                totalAmount = voucher.VALUE < voucher.MAX_DISCOUNT ? totalAmount - voucher.VALUE  : totalAmount - voucher.MAX_DISCOUNT
            }

            totalAmount = totalAmount < 0 ? 0 : totalAmount          

            // nếu không phải hóa đơn nháp, cập nhật số lần dùng voucher vào DB
            if (status !== 'DRAFT' || purchaseMethod === 'ONLINE') {
                try {
                    const {updateVoucher} = await voucherService.updateNumberUsing(voucher)
                    if (updateVoucher?.error) {
                        return {error: updateVoucher.error}
                    }

                    else {
                        vouchers.push(voucher)
                    }
                } catch (error) {
                    if (vouchers.length > 0) {
                        await voucherService.rollbackNumberUsing(vouchers)
                    }
                    
                    throw new Error(error)
                }
            }
        }

        const finalTotal = extraFee ? (totalAmount + taxValue + extraFee) : (totalAmount + taxValue)

        const invoiceData = {
            INVOICE_CODE: now.getTime(),
            CREATED_BY_USER: createdBy,
            CUSTOMER_ID: customerId || null,
            SELL_DATE: now,
            SOLD_BY: soldBy || null,
            STATUS: status,
            DELIVERY_INFORMATION: {
                NAME: name,
                ADDRESS: {
                    COUNTRY: country,
                    CITY: city,
                    DISTRICT: district,
                    WARD: ward,
                    DETAIL: detail,
                },
                PHONE_NUMBER: phoneNumber,
                EMAIL: email,
            },
            NOTE: note,
            ITEMS: items,
            TOTAL_AMOUNT: totalAmount,
            VOUCHER_GLOBAL_ID: voucherGlobalId,
            TAX: tax,
            EXTRA_FEE: extraFee,
            EXTRA_FEE_UNIT: extraFeeUnit,
            EXTRA_FEE_NOTE: extraFeeNote,
            TOTAL_WITH_TAX_EXTRA_FEE: finalTotal,         
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

                // rollback nếu xảy ra lỗi
                if (status === 'CONFIRMED' || status === 'PAYMENTED') {
                    await invoiceHelper.rollbackItems(count, originalItems, backupItems)
                }
                if (vouchers.length > 0) {
                    await voucherService.rollbackNumberUsing(vouchers)
                }
                console.log(error)
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

const checkValidVouchers = async (items) => {
    let valid = true

    for (const item of items) {
        if (item.PRODUCT_VOUCHER_ID !== null) {
            const voucher = await Voucher.findById(item.PRODUCT_VOUCHER_ID)
            const isAvailable = voucherService.isVoucherAvailable(voucher)
            if (isAvailable?.error) {
                valid = false
            }
        }        
    }

    return valid
}

const updateInvoiceStatus = async (invoice, status) => {
    // const {invoiceCode, status} = data
    const now = new Date()
    let count = 0       // đếm document

    // const invoice = await SalesInvoice.findOne({ INVOICE_CODE: invoiceCode })

    if(!invoice) {
        return ({error: "Không tìm thấy hóa đơn."})
    }
    if (invoice.STATUS === 'DRAFT' && status === 'DRAFT') {
        return
    }
    if (invoice.STATUS !== 'DRAFT' && status === 'DRAFT') {
        return ({error: `Không thể chuyển trạng thái hóa đơn ${invoice.STATUS} sang trạng thái DRAFT.`})
    }
    if (invoice.STATUS === 'PAYMENTED' || invoice.STATUS === 'CANCELLED') {
        return ({error: "Hóa đơn đã đạt trạng thái cuối."})
    }  
    if (invoice.STATUS === 'CONFIRMED' && status !== 'PAYMENTED') {
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

const rollbackDataForCancellingOrder = async (invoice) => {
    const now = new Date()
    const {originalItems, backupItems, error} = await (async () => {
        try {
            // const itemCodes = invoice.ITEMS.map(item => item.ITEM_CODE)
            return invoiceHelper.getItemDocument(invoice.ITEMS)
        } catch (error) {
            console.log(error)
            throw new Error(error.message)
        }
    })()

    if (error) {
        return {error: "Lỗi khi truy vấn dữ liệu items."}
    }

    let count = 0
    const backupVouchers = []
    const originalVouchers = []

    try {
        for (const origin of originalItems) {
            for (const item of invoice.ITEMS) {
                if (origin.ITEM_CODE === item.ITEM_CODE) {
                    origin.ITEM_STOCKS.QUANTITY += item.QUANTITY
                    origin.UPDATED_AT = now

                    try {
                        await origin.save()
                        count++
                    } catch (error) {
                        throw new Error ("Lỗi xảy ra khi cập nhật số lượng items.")
                    }

                    if (item.PRODUCT_VOUCHER_ID) {
                        const voucher = await Voucher.findById(item.PRODUCT_VOUCHER_ID)
                        if (!voucher) {
                            if (originalVouchers.length > 0) {
                                await voucherService.rollbackNumberUsing(originalVouchers, backupVouchers)
                            }
                            await invoiceHelper.rollbackItems(count, originalItems, backupItems)
                            return {error: `Không tìm thấy voucher ${item.PRODUCT_VOUCHER_ID}`}
                        }
                        
                        backupVouchers.push({...voucher.toObject?.() || voucher})

                        voucher.NUMBER_USING -= item.QUANTITY
                        try {
                            await voucher.save()
                            originalVouchers.push(voucher)
                        } catch (error) {
                            console.log(error)
                            throw new Error ("Lỗi khi cập nhật số lượng sử dụng vouchers.")
                        }
                    }

                    break
                }
            }
        }

        if (invoice.VOUCHER_GLOBAL_ID) {
            const voucher = await Voucher.findById(invoice.VOUCHER_GLOBAL_ID)

            if (!voucher) {
                if (originalVouchers.length > 0) {
                    await voucherService.rollbackNumberUsing(originalVouchers, backupVouchers)
                }
                await invoiceHelper.rollbackItems(count, originalItems, backupItems)
                return {error: `Không tìm thấy voucher ${invoice.VOUCHER_GLOBAL_ID}`}
            }

            voucher.NUMBER_USING -= 1

            try {
                await voucher.save()
            } catch (error) {
                console.log(error)
                throw new Error (`Lỗi khi cập nhật số lượng sử dụng voucher ${invoice.VOUCHER_GLOBAL_ID}`)
            }
        }

    } catch (error) {
        if (originalVouchers.length > 0) {
            await voucherService.rollbackNumberUsing(originalVouchers, backupVouchers)
        }
        await invoiceHelper.rollbackItems(count, originalItems, backupItems)
        
        console.log(error)
        throw new Error ("Lỗi xảy ra khi cập nhật dữ liệu.")
    }
}

const updateInvoice = async (data) => {

    const {items, invoiceCode, status, globalVoucher, note, 
            extraFee, extraFeeNote, extraFeeUnit, paymentMethod, purchaseMethod, tax} = data
    const invoice = await SalesInvoice.findOne({ INVOICE_CODE: invoiceCode })
    const backupInvoice = _.cloneDeep(invoice.toObject())
    const now = new Date()

    if(!invoice) {
        return ({error: "Không tìm thấy hóa đơn."})
    }

    // if (invoice.STATUS !== 'DRAFT') {
    //     return {error: `Không thể cập nhật chi tiết hóa đơn đang có trạng thái ${invoice.STATUS}.`}
    // }

    if (status === 'CANCELLED') {
        if (invoice.STATUS !== 'DRAFT') {
            return {error: `Không thể cập nhật trạng thái CANCELLED cho hóa đơn ${invoice.STATUS}`}
        }

        if (invoice.PURCHASE_METHOD === 'ONLINE') {
            const response = await rollbackDataForCancellingOrder(invoice)
            if (response?.error) {
                return response
            }
        }
        
        try {
            invoice.STATUS = status
            invoice.UPDATED_AT = now

            await invoice.save()

            return await handleInvoiceDataForResponse(invoice)
        } catch (error) {
            console.log (error)
            throw new Error ('Lỗi xảy ra khi cập nhật hóa đơn.')
        }
    }

    try {
 
        if (invoice.STATUS === 'DRAFT') {
            // cập nhật danh sách item nếu có
            if (items && items.length > 0) {
                const itemCodes = items.map(item => item.ITEM_CODE)
                const originalItems = await Item.find({ ITEM_CODE: { $in: itemCodes } })

                const updatingItems = await updateInvoiceItems(items, originalItems)
                if (updatingItems?.error) {
                    return { error: updatingItems.error }
                }

                for (const newItems of items) {
                    let oldItemFlag = false
                    for (let i=0; i < invoice.ITEMS.length; i++) {
                        if (newItems.ITEM_CODE === invoice.ITEMS[i].ITEM_CODE) {
                            invoice.ITEMS[i] = newItems
                            oldItemFlag = true
                            break
                        }
                    }

                    if (!oldItemFlag) {
                        invoice.ITEMS.push(newItems)
                    }
                }
            }

            // cập nhật voucher (nếu có) và kiểm tra khả dụng
            const voucher = globalVoucher ? await Voucher.findById(globalVoucher) :
                                            invoice.VOUCHER_GLOBAL_ID ? await Voucher.findById(invoice.VOUCHER_GLOBAL_ID) : null
            const isAvailable = voucher ? voucherService.isVoucherAvailable(voucher).available : null
            const isValidVoucher = checkValidVouchers(invoice.ITEMS)
            
            if (isValidVoucher || (voucher && isAvailable === false)){
                if (isAvailable === false) {
                    invoice.VOUCHER_GLOBAL_ID = null
                }
            }


            // tính lại tổng tiền
            let totalAmount = 0
            for (const item of invoice.ITEMS) {
                totalAmount += item.TOTAL_PRICE
            }
            
            // cập nhật thuế (nếu có) và tính lại giá trị thuế
            invoice.TAX = tax ? tax : invoice.TAX ? invoice.TAX : null
            const taxValue = invoice.TAX ? totalAmount * invoice.TAX/100 : 0
                
            // cập nhật tổng tiền với giá trị giảm giá (nếu có)
            if (isAvailable === true) {
                const discount = voucher.TYPE === 'PERCENTAGE' ? (totalAmount * voucher.VALUE / 100) : voucher.VALUE
                totalAmount = voucher.MAX_DISCOUNT && discount > voucher.MAX_DISCOUNT ? totalAmount - voucher.MAX_DISCOUNT :
                                                                        totalAmount - discount
            }

            // cập nhật extra fee (nếu có)
            invoice.EXTRA_FEE = extraFee ? extraFee : invoice.EXTRA_FEE ? invoice.EXTRA_FEE : null
            invoice.EXTRA_FEE_UNIT = extraFeeUnit ? extraFeeUnit : invoice.EXTRA_FEE_UNIT ? invoice.EXTRA_FEE_UNIT : null
            invoice.EXTRA_FEE_NOTE = extraFeeNote ? extraFeeNote : invoice.EXTRA_FEE_NOTE ? invoice.EXTRA_FEE_NOTE : null

            // cập nhật tổng tiền cho hóa đơn
            invoice.TOTAL_AMOUNT = totalAmount < 0 ? 0 : totalAmount
            invoice.TOTAL_WITH_TAX_EXTRA_FEE = invoice.EXTRA_FEE ? (invoice.EXTRA_FEE + taxValue + totalAmount) : (taxValue + totalAmount)

            // cập nhật lại ghi chú cho hóa đơn (nếu có)
            invoice.NOTE = note? note : invoice.NOTE ? invoice.NOTE : null

            // cập nhật lại phương thức thanh toán (nếu có)
            invoice.PAYMENT_METHOD = paymentMethod ? paymentMethod : invoice.PAYMENT_METHOD

            // cập nhật lại phương thức mua hàng (nếu có)
            invoice.PURCHASE_METHOD = purchaseMethod ? purchaseMethod : invoice.PURCHASE_METHOD

            invoice.UPDATED_AT = now

            await invoice.save()
        }

        if (status) {
            return await updateInvoiceStatus(invoice, status)
        }

        return await handleInvoiceDataForResponse(invoice)

    } catch (error) {

        Object.assign(invoice, backupInvoice)
        await invoice.save()

        console.log(error)
        throw new Error (error.message)
    }
}

const deleteItems = async (data) => {
    const {items, invoiceCode} = data
    
    try {
        
        const invoice = await SalesInvoice.findOne({INVOICE_CODE: invoiceCode})

        if (!invoice) {
            return {error: `Không tìm thấy hóa đơn ${invoiceCode}`}
        }

        if (invoice.STATUS !== 'DRAFT') {
            return  {error: `Không thể cập nhật chi tiết hóa đơn ở trạng thái ${invoice.STATUS}`}
        }


        if (items && Array.isArray(items)) {
            for (const item of items) {
                for(let index=0; index < invoice.ITEMS.length; index++) {
                    if (item.trim().toString() === invoice.ITEMS[index].ITEM_CODE.trim().toString()) {
                        invoice.ITEMS.splice(index, 1)
                        break
                    }
                } 
            }
        }

        else {
            for(let index=0; index < invoice.ITEMS.length; index++) {
                if (items === invoice.ITEMS[index].ITEM_CODE) {
                    invoice.ITEMS.splice(index, 1)
                    break
                }
            }
        }

        if (invoice.ITEMS.length < 1) {
            await deleteInvoice(null, invoice)
            return {message: "Xóa hóa đơn thành công."}
        }
        else {
            
            invoice.TOTAL_AMOUNT = 0

            for (const item of invoice.ITEMS) {
                invoice.TOTAL_AMOUNT += item.TOTAL_PRICE
            }

            const taxValue = invoice.TAX ? invoice.TAX/100 * invoice.TOTAL_AMOUNT : 0

            if (invoice.VOUCHER_GLOBAL_ID) {
                const voucher = await Voucher.findById(invoice.VOUCHER_GLOBAL_ID)

                const discount = voucher.TYPE === 'PERCENTAGE' ? invoice.TOTAL_AMOUNT * voucher.VALUE/100 : voucher.VALUE
                invoice.TOTAL_AMOUNT = voucher.MAX_DISCOUNT && discount > voucher.MAX_DISCOUNT ? 
                                                        invoice.TOTAL_AMOUNT - voucher.MAX_DISCOUNT : 
                                                        invoice.TOTAL_AMOUNT - discount
                invoice.TOTAL_AMOUNT = invoice.TOTAL_AMOUNT < 0 ? 0 : invoice.TOTAL_AMOUNT
            }

            invoice.TOTAL_WITH_TAX_EXTRA_FEE = invoice.TOTAL_AMOUNT + taxValue + invoice.EXTRA_FEE
            
            // invoice.markModified('ITEMS');
            await invoice.save()
            return await handleInvoiceDataForResponse(invoice)
        }

    } catch (error) {
        console.log(error)
        throw new Error ("Lỗi xảy ra khi xóa item trong hóa đơn.")
    }
}

const deleteInvoice = async (invoiceCode=null, invoice=null) => {
    try {
        if (invoice) {
            if (invoice.STATUS !== 'DRAFT') {
                return {error: `Không thể xóa hóa đơn ở trạng thái ${invoice.STATUS}.`}
            }
            if (invoiceData.PURCHASE_METHOD === 'ONLINE' || invoiceData.PURCHASE_METHOD === 'PRE_ORDER') {
                return { error: `Không thể xóa hóa đơn được mua bằng phương thức ${invoiceData.PURCHASE_METHOD}.` }
            }
            
            await SalesInvoice.findByIdAndDelete(invoice._id)
            return
        }

        const invoiceData = await SalesInvoice.findOne({INVOICE_CODE: invoiceCode})
        if (!invoiceData) {
            return {error: `Không tìm thấy hóa đơn ${invoiceCode}.`}
        }

        if (invoiceData.PURCHASE_METHOD === 'ONLINE' || invoiceData.PURCHASE_METHOD === 'PRE_ORDER') {
            return { error: `Không thể xóa hóa đơn được mua bằng phương thức ${invoiceData.PURCHASE_METHOD}.` }
        }

        if (invoiceData.STATUS !== 'DRAFT') {
            return {error: `Không thể xóa hóa đơn ở trạng thái ${invoiceData.STATUS}.`}
        }

        await SalesInvoice.findByIdAndDelete(invoiceData._id)
        return

    } catch(error) {
        console.log(error)
        throw new Error("Lỗi xảy ra khi xóa hóa đơn nháp.")
    }
}

const statisticInvoiceBasedOnStatus = async (purchaseMethod) => {
    try {
        // console.log(purchaseMethod)
        const pipeline = []
        if (purchaseMethod && purchaseMethod.trim()) {
            pipeline.push({
                $match: {
                    PURCHASE_METHOD: purchaseMethod
                }
            })
        }
        pipeline.push({
            $group: {
                _id: "$STATUS",
                count: { $sum: 1 }
            }
        })
        pipeline.push({
            $project: {
                status: "$_id",
                _id: 0,
                count: 1
            }
        })

        console.log(JSON.stringify(pipeline))

        const statistic = await SalesInvoice.aggregate([pipeline])
        return statistic
    } catch (error) {
        console.log(error)
        throw new Error('Lỗi xảy ra khi truy vấn dữ liệu hóa đơn.')
    }
}

function getLast7Days(date = new Date()) {
  const result = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(date); 
    day.setDate(day.getDate() - i); 
    result.push(new Date(day));
  }

  return result.reverse(); // đảo ngược để từ cũ → mới
}

const statisticsRevenueLast7Days = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6); // tính cả hôm nay là 7 ngày
  sevenDaysAgo.setHours(0, 0, 0, 0);
  now.setHours(23, 59, 59, 999);

  const listday = await SalesInvoice.aggregate([
    {
      $match: {
        STATUS: "PAYMENTED",
        SELL_DATE: { $gte: sevenDaysAgo, $lte: now }
      }
    },
    {
      $project: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$SELL_DATE" } },
        purchase_method_name: "$PURCHASE_METHOD",
        total: "$TOTAL_AMOUNT"
      }
    },
    {
      $group: {
        _id: {
          date: "$date",
          purchase_method_name: "$purchase_method_name"
        },
        total_amount: { $sum: "$total" },
        quantity: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: "$_id.date",
        purchase_methods: {
          $push: {
            purchase_method_name: "$_id.purchase_method_name",
            total_amount: "$total_amount",
            quantity: "$quantity"
          }
        },
        total: { $sum: "$total_amount" },
        quantity: { $sum: "$quantity" }
      }
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        purchase_methods: 1,
        total: 1,
        quantity: 1
      }
    },
    { $sort: { date: 1 } }
  ]);

  // Tổng cộng tất cả 7 ngày
  const total = listday.reduce((sum, item) => sum + item.total, 0);
  const quantity = listday.reduce((sum, item) => sum + item.quantity, 0);

  return {
    listday,
    total,
    quantity
  };
};



const statisticsRevenueLast4Weeks = async (dayInMonth = null) => {

  // Nếu dayInMonth không được cung cấp, sử dụng ngày hiện tại
  let now = new Date();
  let fourWeeksAgo = new Date();
  if(dayInMonth !== null) {
    const inputDate = new Date(dayInMonth);
    console.log(inputDate);
    // Ngày bắt đầu tháng
    fourWeeksAgo = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);
    fourWeeksAgo.setHours(0, 0, 0, 0);

    // Ngày kết thúc tháng
    now = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0);
    now.setHours(23, 59, 59, 999);
    console.log(fourWeeksAgo, now);
  }else{
    now = new Date();
    fourWeeksAgo = new Date();
  }

  fourWeeksAgo.setDate(now.getDate() - 28);
  fourWeeksAgo.setHours(0, 0, 0, 0);
  now.setHours(23, 59, 59, 999);

  const listweek = await SalesInvoice.aggregate([
    {
      $match: {
        STATUS: "PAYMENTED",
        SELL_DATE: { $gte: fourWeeksAgo, $lte: now }
      }
    },
    {
      $project: {
        week: { $isoWeek: "$SELL_DATE" },
        year: { $isoWeekYear: "$SELL_DATE" },
        total: "$TOTAL_AMOUNT",
        purchase_method_name: "$PURCHASE_METHOD"
      }
    },
    {
      $group: {
        _id: {
          week: "$week",
          year: "$year",
          purchase_method_name: "$purchase_method_name"
        },
        total_amount: { $sum: "$total" },
        quantity: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          week: "$_id.week",
          year: "$_id.year"
        },
        purchase_methods: {
          $push: {
            purchase_method_name: "$_id.purchase_method_name",
            total_amount: "$total_amount",
            quantity: "$quantity"
          }
        },
        total: { $sum: "$total_amount" },
        quantity: { $sum: "$quantity" }
      }
    },
    {
      $project: {
        _id: 0,
        week: {
          $concat: [
            "Tuần ",
            { $toString: "$_id.week" },
            " - ",
            { $toString: "$_id.year" }
          ]
        },
        purchase_methods: 1,
        total: 1,
        quantity: 1
      }
    },
    {
      $sort: { week: 1 }
    }
  ]);

  // ✅ Tổng kết
  const total = listweek.reduce((sum, w) => sum + w.total, 0);
  const quantity = listweek.reduce((sum, w) => sum + w.quantity, 0);

  return {
    listweek,
    total,
    quantity
  };
};


const statisticsRevenueLast4Months = async () => {
  const now = new Date();
  const fourMonthsAgo = new Date();
  fourMonthsAgo.setMonth(now.getMonth() - 4);
  fourMonthsAgo.setDate(1);
  fourMonthsAgo.setHours(0, 0, 0, 0);
  now.setHours(23, 59, 59, 999);

  const listmonth = await SalesInvoice.aggregate([
    {
      $match: {
        STATUS: "PAYMENTED",
        SELL_DATE: { $gte: fourMonthsAgo, $lte: now }
      }
    },
    {
      $project: {
        month: { $month: "$SELL_DATE" },
        year: { $year: "$SELL_DATE" },
        total: "$TOTAL_AMOUNT",
        purchase_method_name: "$PURCHASE_METHOD"
      }
    },
    {
      $group: {
        _id: {
          month: "$month",
          year: "$year",
          purchase_method_name: "$purchase_method_name"
        },
        total_amount: { $sum: "$total" },
        quantity: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          month: "$_id.month",
          year: "$_id.year"
        },
        purchase_methods: {
          $push: {
            purchase_method_name: "$_id.purchase_method_name",
            total_amount: "$total_amount",
            quantity: "$quantity"
          }
        },
        total: { $sum: "$total_amount" },
        quantity: { $sum: "$quantity" }
      }
    },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            "Tháng ",
            { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] },
            " - ",
            { $toString: "$_id.year" }
          ]
        },
        purchase_methods: 1,
        total: 1,
        quantity: 1
      }
    },
    {
      $sort: { month: 1 }
    }
  ]);

  // Tính tổng tất cả 4 tháng
  const total = listmonth.reduce((sum, m) => sum + m.total, 0);
  const quantity = listmonth.reduce((sum, m) => sum + m.quantity, 0);

  return {
    listmonth,
    total,
    quantity
  };
};

const statisticsSalesItem = async(query) => {
    const {fromDate, toDate} = query
    const matchConditions = {
        STATUS: "PAYMENTED",
    }

    if (fromDate && fromDate.trim()) {
        if (toDate && toDate.trim()) {
            matchConditions.SELL_DATE = {
                $gte: new Date((new Date(fromDate)).setHours(0,0,0,0)),
                $lte: new Date((new Date(toDate)).setHours(23,59,59,999))      
            }
        }

        else {
            matchConditions.SELL_DATE = {
                $gte: new Date((new Date(fromDate)).setHours(0,0,0,0))
            }
        }
    }

    else {
        if (toDate && toDate.trim()) {
            matchConditions.SELL_DATE = {
                $lte: new Date((new Date(toDate)).setHours(23,59,59,999)) 
            }
        }
    }

    // pipeline.push({
    //     $match: matchConditions
    // })
    // pipline.push
    console.log(matchConditions)
    const pipeline = [
        {
            $match: matchConditions
        },
        {
            $unwind: {
                path: "$ITEMS",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                item: "$ITEMS"
            }
        },
        {
            $group: {
                _id: "$item.ITEM_CODE",
                quantity: { $sum: "$item.QUANTITY" },
                total_amount: { $sum: "$item.TOTAL_PRICE" }
            }
        },
        
    ]

    console.log(pipeline)
    const listItem = await SalesInvoice.aggregate([
        {
            $match: matchConditions
        },
        {
            $unwind: {
                path: "$ITEMS",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                item: "$ITEMS"
            }
        },
        {
            $group: {
                _id: "$item.ITEM_CODE",
                quantity: { $sum: "$item.QUANTITY" },
                total_amount: { $sum: "$item.TOTAL_PRICE" }
            }
        },
        {
            $lookup: {
                from: 'items',
                localField: '_id',
                foreignField: 'ITEM_CODE',
                as: 'item'
            }
        },
        {
            $unwind: {
                path: '$item',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                ITEM_CODE: '$item.ITEM_CODE',
                ITEM_NAME: '$item.ITEM_NAME',
                AVATAR_IMAGE_URL: '$item.AVATAR_IMAGE_URL',
                quantity: 1,
                total_amount: 1,
                _id: 0
            }
        }
    ]);

    // Tính tổng tất cả 4 tháng
    const total = listItem.reduce((sum, m) => sum + m.total_amount, 0);
    const quantity = listItem.reduce((sum, m) => sum + m.quantity, 0);
    console.log(listItem)
    return {
        listItem,
        total,
        quantity
    };
}


const cancelOrder = async (invoiceCode, user) => {
    try {
        const invoice = await SalesInvoice.findOne({INVOICE_CODE: invoiceCode})

        if (!invoice || invoice.CREATED_BY_USER.toString() !== user.USER_ID) {
            return {error: `Không tìm thấy hóa đơn ${invoiceCode} hoặc không có quyền truy cập.`}
        }

        if (invoice.STATUS !== 'DRAFT') {
            return {error: `Không thể hủy đơn hàng có trạng thái ${invoice.STATUS}.`}
        }

        const response = await rollbackDataForCancellingOrder(invoice)
        if (response?.error) {
            return response
        }

        invoice.STATUS = 'CANCELLED'
        invoice.UPDATED_AT = new Date()

        await invoice.save()
        return await handleInvoiceDataForResponse(invoice)
    } catch(error) {
        console.log(error)
        throw new Error('Lỗi xảy ra khi hủy đơn hàng.')
    }
}

module.exports = {
    getAllInvoices,
    getInvoiceByCode,
    createInvoice,
    updateInvoice,
    deleteItems,
    deleteInvoice,
    statisticInvoiceBasedOnStatus,
    cancelOrder,
    statisticInvoiceBasedOnStatus,
    statisticsRevenueLast7Days,
    statisticsRevenueLast4Weeks,
    statisticsRevenueLast4Months,
    statisticsSalesItem
}