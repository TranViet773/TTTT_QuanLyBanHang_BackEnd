const PurchaseInvoice = require("../models/PurchaseInvoices.model")
const Supplier = require("../models/Supplier.model")
const Account = require("../models/Account.model")
const User = require("../models/User.model")
const authHelper = require("../helpers/auth.helper")
const invoiceHelper = require('../helpers/invoice.helper')
const { ObjectId } = require('mongodb')
const purcharseInvoice = require("../models/PurchaseInvoices.model");

const handleInvoiceDataForResponse = async (invoice) => {
    console.log(invoice)

    try {
        const pipeline = [
            {
                $lookup: {
                    from: 'suppliers',            // Tên collection liên kết
                    localField: 'ITEMS.SUPPLIER_ID',       // Trường chứa ObjectId
                    foreignField: '_id',
                    as: 'SUPPLIER_DETAILS'
                },
                
            },
            {
                $lookup: {
                    from: 'items',            // Tên collection liên kết
                    localField: 'ITEMS.ITEM_CODE',       // Trường chứa ObjectId
                    foreignField: 'ITEM_CODE',
                    as: 'ITEM_DETAILS'
                },
                
            },
            {
                $lookup: {
                    from: 'unit_invoices',            // Tên collection liên kết
                    localField: 'ITEMS.UNIT',       // Trường chứa ObjectId
                    foreignField: '_id',
                    as: 'ITEM_UNIT_INVOICES'
                },
                
            },
            {
                $addFields: {
                    ITEMS: {
                        $map: {
                            input: "$ITEMS",
                            as: "item",
                            in: {
                                $mergeObjects: [
                                    "$$item",
                                    {
                                        ITEM_DETAIL: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: "$ITEM_DETAILS",
                                                    as: "item_detail",
                                                    cond: {
                                                        $eq: ["$$item.ITEM_CODE", "$$item_detail.ITEM_CODE"]
                                                    }
                                                }
                                            }, 0]
                                        }
                                    },
                                    {
                                        SUPPLIER: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: "$SUPPLIER_DETAILS",
                                                    as: "supplier",
                                                    cond: {
                                                        $eq: ["$$item.SUPPLIER_ID", "$$supplier._id"]
                                                    }
                                                }
                                            }, 0]   // $arrayElemAt: [{}, 0] => lấy phần tử đầu tiên tìm được (mảng filter)
                                        }
                                    },
                                    {
                                        UNIT: {
                                            $arrayElemAt: [{
                                                $filter: {
                                                    input: "$ITEM_UNIT_INVOICES",
                                                    as: "unit",
                                                    cond: {
                                                        $eq: ["$$item.UNIT", "$$unit._id"]
                                                    }
                                                }
                                            }, 0] 
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $unset: [
                    "ITEMS.SUPPLIER.IS_ACTIVE", "ITEMS.SUPPLIER._id", "ITEMS.SUPPLIER_ID",
                    "ITEMS.ITEM_DETAIL._id", "ITEMS.ITEM_DETAIL.ITEM_CODE", "ITEMS.ITEM_DETAIL.ITEM_TYPE", "ITEMS.ITEM_DETAIL.UNIT",
                    "ITEMS.ITEM_DETAIL.PRICE", "ITEMS.ITEM_DETAIL.DESCRIPTION", "ITEMS.ITEM_DETAIL.CREATED_AT",
                    "ITEMS.ITEM_DETAIL.UPDATED_AT", "ITEMS.ITEM_DETAIL.IMPORTED_BY", "ITEMS.ITEM_DETAIL.ITEM_STOCKS",
                    "ITEMS.ITEM_DETAIL.BOM_MATERIALS", "ITEMS.ITEM_DETAIL.LIST_VOUCHER_ACTIVE", "ITEMS.ITEM_DETAIL.IS_ACTIVE"
                ]
            },
            {
                $lookup: {
                    from: 'unit_invoices',
                    localField: 'EXTRA_FEE_UNIT',
                    foreignField: '_id',
                    as: 'UNIT_INVOICE',
                }
            },
            {
                $unwind: {
                    path: '$UNIT_INVOICE',
                    preserveNullAndEmptyArrays: true        
                }
            },
            {
                $lookup: {
                    from: 'accounts',            // Tên collection liên kết
                    localField: 'IMPORTED_BY',       // Trường chứa ObjectId
                    foreignField: 'USER_ID',
                    as: 'ACCOUNT'
                },
            },
            { 
                $unwind: {
                    path: '$ACCOUNT',
                    preserveNullAndEmptyArrays: true
                }   // bung mảng thành document
            },
            {
                $project: {
                    _id: 0,
                    INVOICE_CODE: "$INVOICE_CODE",
                    IMPORT_DATE: "$IMPORT_DATE",
                    IMPORTED_BY: "$ACCOUNT.USERNAME",
                    STATUS: "$STATUS",
                    TOTAL_AMOUNT: "$TOTAL_AMOUNT",
                    EXTRA_FEE: "$EXTRA_FEE",
                    EXTRA_FEE_NOTE: "$EXTRA_FEE_NOTE",
                    TAX: "$TAX",
                    TOTAL_WITH_TAX_EXTRA_FEE: "$TOTAL_WITH_TAX_EXTRA_FEE",
                    ITEMS: "$ITEMS",
                    PAYMENTED: "$PAYMENTED",
                }
            }
        ]

        const response = await PurchaseInvoice.aggregate([
            { 
                $match: {
                    _id: invoice._id
                }
            },
            ...pipeline
        ])

        if (invoice.IMPORTED_BY) {
            const user = await User.findById(invoice.IMPORTED_BY)
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
        throw new Error("Lỗi xảy ra khi truy vấn dữ liệu hóa đơn.")
    }
}

const getAllInvoices = async (query) => {
    try {

        const {page, limit, search, userId, fromDate, toDate} = query

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
                    localField: 'IMPORTED_BY',       // Trường chứa ObjectId
                    foreignField: 'USER_ID',
                    as: 'ACCOUNT'
                },
                
            },
            { 
                $unwind: {
                    path: '$ACCOUNT',
                    preserveNullAndEmptyArrays: true
                }   // bung mảng thành document
            },
        ]

        if (search?.trim()) {
            console.log(search)
            matchConditions.push({
                $or: [
                    { INVOICE_CODE: { $regex: search, $options: 'i' } },
                    { 'ACCOUNT.USERNAME': { $regex: search, $options: 'i' } },
                ]
            })
        }

        if (userId?.trim()) {
            matchConditions.push({IMPORTED_BY: new ObjectId(userId)})
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
                IMPORT_DATE: {
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
                IMPORT_DATE: "$IMPORT_DATE",
                IMPORTED_BY: "$ACCOUNT.USERNAME",
                STATUS: "$STATUS",
                TOTAL_WITH_TAX_EXTRA_FEE: "$TOTAL_WITH_TAX_EXTRA_FEE",
                PAYMENTED: "$PAYMENTED"
            }
        })
        pipeline.push({ $sort: {IMPORT_DATE: -1} })
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

const getInvoiceByCode = async (invoiceCode, user) => {
    try {
        const invoice = await PurchaseInvoice.findOne({INVOICE_CODE: invoiceCode})

        console.log(invoice)

        return await handleInvoiceDataForResponse(invoice)
    } catch (error) {
        throw new Error("Lỗi khi truy vấn dữ liệu hóa đơn.")
    }
} 

const updateItemForImporting = async (items, originalItems, backupItems, now) => {
        
    let totalAmount = 0     // tổng tiền hàng của hóa đơn
    let count = 0           // đếm số lượng các item đã update, hỗ trợ cho rollback không cần phải duyệt những item chưa được update
    
    // duyệt qua mảng items đầu vào
    for(const addItem of items) {       // không dùng forEach vì await có thể không hoạt động đúng mong đợi (forEach không đợi, sai ngữ cảnh)

        // tính tổng tiền cho item
        addItem.TOTAL_PRICE = addItem.UNIT_PRICE * addItem.QUANTITY

        // kiểm tra nhà cung cấp có tồn tại
        if(!await Supplier.findOne({ _id: addItem.SUPPLIER_ID })) {
            await invoiceHelper.rollbackItems(count, originalItems, backupItems)
            return({error: "Nhà cung cấp không tồn tại."})
        }
        
        // cập nhật số lượng và thời gian update cho document item trong DB
        for(const item of originalItems) {
            if (item.ITEM_CODE === addItem.ITEM_CODE) {
                item.ITEM_STOCKS.QUANTITY +=  addItem.QUANTITY,
                item.ITEM_STOCKS.LAST_UPDATED = now

                const price = authHelper.isValidInfo(item.PRICE)
                addItem.UNIT = price.get("UNIT")
                addItem.UNIT_PRICE = price.PRICE_AMOUNT
                addItem.TOTAL_PRICE = price.PRICE_AMOUNT * addItem.QUANTITY
                
                try {
                    await item.save()
                    totalAmount += addItem.TOTAL_PRICE      // cập nhật tổng tiền của hóa đơn
                    count++
                    break
                } catch (error) {
                    await invoiceHelper.rollbackItems(count, originalItems, backupItems)

                    console.log(error.message)
                    throw new Error("Cập nhật số lượng item thất bại.")
                }
            }
        }         
    }

    return {totalAmount, count}
}

const createInvoice = async (data) => {
    const {importedBy, statusName, extraFee, extraFeeUnit, extraFeeNote, tax, items, paymented} = data

    try {
        if(!await Account.findOne({ USER_ID: importedBy })) {
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

        if (statusName === 'CONFIRMED' || statusName === 'PAYMENTED') {
            const updatingData = await updateItemForImporting(items, originalItems, backupItems, now)

            console.log(updatingData)

            if (updatingData.errorItemUpdating) {
                return updatingData
            }
            
            count = updatingData.count
            totalAmount = updatingData.totalAmount
        }
        
        else {
            for(const addItem of items) {          
              
                if (!addItem.SUPPLIER_ID || !await Supplier.findById(addItem.SUPPLIER_ID)) {
                    return ({ error: `Không tìm thấy nhà cung cấp của item ${addItem.ITEM_CODE}` })
                }
                
                for(const item of originalItems) {

                    if(item.ITEM_CODE === addItem.ITEM_CODE) {

                        const price = authHelper.isValidInfo(item.PRICE)
                        addItem.UNIT = price.get("UNIT")
                        addItem.UNIT_PRICE = price.PRICE_AMOUNT
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
                    await invoiceHelper.rollbackItems(count, originalItems, backupItems)
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

const updateInvoice = async (data) => {
    const {invoiceCode, statusName} = data
    const now = new Date()
    let count = 0       // đếm document

    const invoice = await PurchaseInvoice.findOne({ INVOICE_CODE: invoiceCode })

    if(!invoice) {
        return ({error: "Không tìm thấy hóa đơn."})
    }

    let statusFlag = false

    if (statusName === 'DRAFT') {
        return ({error: "Không thể cập nhật trạng thái DRAFT."})
    }

    invoice.STATUS.slice().reverse().forEach(status => {
        if (status.STATUS_NAME === 'PAYMENTED' || status.STATUS_NAME === 'REJECTED') {
            statusFlag = 1
            return
        }  
        if (status.STATUS_NAME === 'CONFIRMED' && statusName !== 'PAYMENTED') {
            statusFlag = 2
            return
        }
    })

    if (statusFlag === 1) {
        return ({error: "Hóa đơn đã đạt trạng thái cuối."})
    }

    if (statusFlag === 2) {
        return ({ error: `Không thể chuyển sang trạng thái ${statusName} cho hóa đơn đã được xác nhận.` })
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
            const lastStatus = authHelper.isValidInfo(invoice.STATUS)
            lastStatus.THRU_DATE = now
            console.log("Last status:", lastStatus)

            invoice.STATUS.push({
                STATUS_NAME: statusName,
                FROM_DATE: now,
                THRU_DATE: null
            })

            if (
                (lastStatus.STATUS_NAME === 'DRAFT' || lastStatus.STATUS_NAME === 'PENDING_APPROVAL') && 
                (statusName === 'CONFIRMED' || (statusName === 'PAYMENTED' && lastStatus.STATUS_NAME !== 'CONFIRMED'))
            ) {
                const updateItems = await updateItemForImporting(invoice.ITEMS, originalItems, backupItems, now)

                if (updateItems.error) {
                    return updateItems
                }

                count = updateItems.count             
            }

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

const deleteItems = async (data) => {
    const {items, invoiceCode} = data
    
    try {
        
        const invoice = await PurcharseInvoice.findOne({INVOICE_CODE: invoiceCode})

        if (!invoice) {
            return {error: `Không tìm thấy hóa đơn ${invoiceCode}`}
        }

        const validStatus = authHelper.isValidInfo(invoice.STATUS);

        if (validStatus.STATUS_NAME !== 'DRAFT') {
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

            invoice.TOTAL_WITH_TAX_EXTRA_FEE = invoice.TOTAL_AMOUNT + taxValue + invoice.EXTRA_FEE
            
            // invoice.markModified('ITEMS');
            await invoice.save()
            return await handleInvoiceDataForResponse(invoice)
        }

    } catch (error) {
        console.log(error)
        throw new Error ("Lỗi xảy ra khi xóa item(s) trong hóa đơn.")
    }
}

const deleteInvoice = async (invoiceCode=null, invoice=null) => {
    try {

        if (invoice) {
            const validStatus = authHelper.isValidInfo(invoice.STATUS);
            if (validStatus.STATUS_NAME !== 'DRAFT') {
                return {error: `Không thể xóa hóa đơn ở trạng thái ${validStatus.STATUS_NAME}.`}
            }

            await PurcharseInvoice.findByIdAndDelete(invoice._id)
            return
        }

        const invoiceData = await PurcharseInvoice.findOne({INVOICE_CODE: invoiceCode})
        const validStatus = authHelper.isValidInfo(invoiceData.STATUS);        
        if (!invoiceData) {
            return {error: `Không tìm thấy hóa đơn ${invoiceCode}.`}
        }
        if (validStatus.STATUS_NAME !== 'DRAFT') {
            return {error: `Không thể xóa hóa đơn ở trạng thái ${validStatus.STATUS_NAME}.`}
        }

        await PurcharseInvoice.findByIdAndDelete(invoiceData._id)
        return

    } catch(error) {
        console.log(error)
        throw new Error("Lỗi xảy ra khi xóa hóa đơn nháp.")
    }
}

module.exports = {
    getAllInvoices,
    getInvoiceByCode,
    createInvoice,
    updateInvoice,
}