const PurchaseInvoice = require("../models/PurchaseInvoices.model")
const Supplier = require("../models/Supplier.model")
const Account = require("../models/Account.model")
const Item = require("../models/Item.model")

const handleInvoiceDataForResponse = async (invoice, accountData=null) => {

    try {
        const supplier = await Supplier.findById(invoice.SUPPLIER_ID) || null
        console.log(supplier)
        const account = accountData ? accountData : await Account.findOne({USER_ID: invoice.IMPORTED_BY}) 
        console.log("Account", account)
        const sup = supplier ? {
            SUPPLIER_NAME: supplier.SUPPLIER_NAME,
            SUPPLIER_PHONE: supplier.SUPPLIER_PHONE,
            SUPPLIER_ADDRESS: supplier.SUPPLIER_ADDRESS,
            SUPPLIER_EMAIL: supplier.SUPPLIER_EMAIL,
            SUPPLIER_TAX_CODE: supplier.SUPPLIER_TAX_CODE,
            SUPPLIER_CONTACT_PERSON_NAME: supplier.SUPPLIER_CONTACT_PERSON_NAME,
            NOTE: supplier.NOTE,
        } : null

        return {
            INVOICE_CODE: invoice.INVOICE_CODE,
            SUPPLIER: sup,
            IMPORT_DATE: invoice.IMPORTED_DATE,
            IMPORTED_BY: account.USERNAME,
            STATUS: invoice.STATUS,
            TOTAL_AMOUNT: invoice.TOTAL_AMOUNT,
            EXTRA_FEE: invoice.EXTRA_FEE,
            EXTRA_FEE_NOTE: invoice.EXTRA_FEE_NOTE,
            TAX: invoice.TAX,
            TOTAL_WITH_TAX_EXTRA_FEE: invoice.TOTAL_WITH_TAX,
            ITEMS: invoice.ITEMS,
            PAYMENTED: invoice.PAYMENTED
        }

    } catch (error) {
        throw new Error("Lỗi xảy ra khi truy vấn dữ liệu hóa đơn.")
    }
}

const getAllInvoices = async (query) => {
    try {

        const {page, limit, search, userId} = query

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
                    from: 'suppliers',            // Tên collection liên kết
                    localField: 'SUPPLIER_ID',       // Trường chứa ObjectId
                    foreignField: '_id',
                    as: 'SUPPLIER'
                },
                
            },
            { 
                $unwind: {
                    path: '$SUPPLIER',
                    preserveNullAndEmptyArrays: true        // Đặt trường thành null nếu SUPPLIER_ID = null
                }   // bung mảng thành document
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
        ]

        if (search?.trim()) {
            console.log(search)
            matchConditions.push({
                $or: [
                    { INVOICE_CODE: { $regex: search, $options: 'i' } },
                    { IMPORT_DATE: { $regex: search, $options: 'i' } },
                    { 'SUPPLIER.SUPPLIER_NAME': { $regex: search, $options: 'i' } }, // Tìm theo tên supplier
                    { 'SUPPLIER.SUPPLIER_EMAIL': { $regex: search, $options: 'i' } },
                    { 'SUPPLIER.SUPPLIER_PHONE': { $regex: search, $options: 'i' } },
                    { 'ACCOUNT.USERNAME': { $regex: search, $options: 'i' } },
                ]
            })
        }

        if (userId?.trim()) {
            matchConditions.push({IMPORTED_BY: userId})
            console.log("thêm user id")
        }

        console.log("match: ", matchConditions)

        console.log("match length: ", matchConditions.length)

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
                SUPPLIER: {
                    SUPPLIER_NAME: "$SUPPLIER.SUPPLIER_NAME",
                    SUPPLIER_PHONE: "$SUPPLIER.SUPPLIER_PHONE",
                    SUPPLIER_ADDRESS: "$SUPPLIER.SUPPLIER_ADDRESS",
                    SUPPLIER_EMAIL: "$SUPPLIER.SUPPLIER_EMAIL",
                    SUPPLIER_TAX_CODE: "$SUPPLIER.SUPPLIER_TAX_CODE",
                    SUPPLIER_CONTACT_PERSON_NAME: "$SUPPLIER.SUPPLIER_CONTACT_PERSON_NAME",
                    NOTE: "$SUPPLIER.NOTE",
                },
                IMPORT_DATE: "$IMPORT_DATE",
                IMPORTED_BY: "$ACCOUNT.USERNAME",
                STATUS: "$STATUS",
                TOTAL_AMOUNT: "$TOTAL_AMOUNT",
                EXTRA_FEE: "$EXTRA_FEE",
                EXTRA_FEE_NOTE: "$EXTRA_FEE_NOTE",
                TAX: "$TAX",
                TOTAL_WITH_TAX_EXTRA_FEE: "$TOTAL_WITH_TAX",
                ITEMS: "$ITEMS",
                PAYMENTED: "$PAYMENTED"
            }
        })
        pipeline.push({ $sort: {IMPORTED_DATE: -1} })
        pipeline.push({ $skip: skip })
        pipeline.push({ $limit: limitNumber })

        console.log(JSON.stringify(pipeline, null, 2));

        const [totalResult, results] = await Promise.all([
            PurchaseInvoicesModel.aggregate(totalPipeline),
            PurchaseInvoicesModel.aggregate(pipeline)
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

const createInvoice = async (data) => {
    const {supplierId, importedBy, statusName, totalAmount, extraFee, extraFeeNote, tax, items, paymented} = data


    const isImportedInvoice = supplierId ? true : false

    if(!await Account.findOne({ USER_ID: importedBy })) {
        return {error: "Người dùng không tồn tại."}
    }

    const itemCodes = items.map(item => item.ITEM_CODE)
    console.log("Item code list: ", itemCodes)
    const itemList = await Item.find({
        ITEM_CODE: { $in: itemCodes }
    })

    const copyItemList = [...itemList]

    const now = new Date()

    if (isImportedInvoice) {

        let count = 0

        let errorSupplier = false

        items.forEach(async (addItem) => {
            
            if(!await Supplier.findOne({ _id: addItem.SUPPLIER_ID })) {
                errorSupplier = true
                return
            }

            itemList.forEach(async (item) => {
                item.ITEM_STOCKS.QUANTITY +=  addItem.QUANTITY,
                item.ITEM_STOCKS.LAST_UPDATED = now
                
                try {
                    await item.save()
                    count++
                } catch (error) {
                    for(let i=0; i < count; i++) {
                        copyItemList[0].save()
                    }

                    console.log(error.message)

                    throw new Error("Lỗi khi cập nhật số lượng item.")
                }

            })              
        })

        if (errorSupplier) {
            throw new Error("Nhà cung cấp không tồn tại.")
        }
    
    } else {
        let count = 0
        let errorItem = null
        let errorSupplier = false

        items.forEach(async (addItem) => {

            if(!await Supplier.findOne({ _id: addItem.SUPPLIER_ID })) {
                errorSupplier = true
                return
            }

            itemList.forEach(async (item) => {

                if(item.ITEM_CODE === addItem.ITEM_CODE) {
                    item.ITEM_STOCKS.QUANTITY -=  addItem.QUANTITY,
                    item.ITEM_STOCKS.LAST_UPDATED = now

                    if (item.ITEM_STOCKS.QUANTITY < addItem.QUANTITY) {
                        for(let i=0; i < count; i++) {
                            await copyItemList[i].save()
                        }

                        console.log("item sold out")

                        errorItem = item
                    } 

                    try {
                        await item.save()
                        count++
                    } catch (error) {
                        for(let i=0; i <= count; i++) {
                            await copyItemList[i].save()
                        }

                        console.log(error.message)

                        throw new Error("Lỗi khi cập nhật số lượng item.")
                    }
                }
            })    
        })

        if (errorItem) {
            return {error: `Item ${errorItem.ITEM_NAME} không đủ hàng tồn.`}
        }

        if (errorSupplier) {
            throw new Error("Nhà cung cấp không tồn tại.")
        }
    }

    const invoiceData = {
        INVOICE_CODE: now.getTime(),
        SUPPLIER_ID: supplierId || null,
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
        EXTRA_FEE_NOTE: extraFeeNote,
        TAX: tax,
        TOTAL_WITH_TAX_EXTRA_FEE: totalAmount + totalAmount * (tax/100) + extraFee,
        ITEMS: items,
        PAYMENTED: paymented
    }

    // console.log(invoiceData)
    let invoice = null

    try {
        const newInvoice = new PurchaseInvoice(invoiceData)

        invoice = await newInvoice.save()

        console.log("Lưu thành công")

        return await handleInvoiceDataForResponse(invoice)

    } catch (error) {

        if (invoice) {
            invoice.delete()
        }

        copyItemList.forEach( async (item) => {
            await item.save()
        });

        console.log(error.message)
        throw new Error("Lỗi xảy ra khi lưu hóa đơn.")
    }
}

const getInvoiceByCode = async (invoiceCode) => {
    try {
        const invoice = await PurchaseInvoice.findOne({INVOICE_CODE: invoiceCode})
        return await handleInvoiceDataForResponse(invoice, null)
    } catch (error) {
        throw new Error("Lỗi khi truy vấn dữ liệu hóa đơn.")
    }
} 

module.exports = {
    getAllInvoices,
    createInvoice,
    getInvoiceByCode,
}