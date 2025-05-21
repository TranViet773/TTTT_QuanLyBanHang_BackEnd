const PurchaseInvoice = require("../models/PurchaseInvoices.model")
const Supplier = require("../models/Supplier.model")
const Account = require("../models/Account.model")

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
            TAX: invoice.TAX,
            TOTAL_WITH_TAX: invoice.TOTAL_WITH_TAX,
            ITEMS: invoice.ITEMS,
        }

    } catch (error) {
        throw new Error("Lỗi xảy ra khi truy vấn dữ liệu hóa đơn.")
    }
}

const getAllInvoices = async (page=1, limit = 10, search, userId) => {
    try {
        // ép kiểu String thành số
        const pageNumber = Math.max(parseInt(page), 1);
        const limitNumber = Math.max(parseInt(limit), 1);
        // tính toán số lượng bản ghi cần bỏ qua
        const skip = (pageNumber - 1) * limitNumber;

        const matchConditions = {}

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
                $unwind: '$SUPPLIER',   // bung mảng thành document
            },
             {
                $lookup: {
                    from: 'accounts',            // Tên collection liên kết
                    localField: 'IMPORTED_BY',       // Trường chứa ObjectId
                    foreignField: '_id',
                    as: 'ACCOUNT'
                },
                
            },
            { 
                $unwind: '$ACCOUNT',   // bung mảng thành document
            },
        ]

        if (search?.trim()) {
            matchConditions.$or = [
                { INVOICE_CODE: { $regex: search, $options: 'i' } },
                { IMPORT_DATE: { $regex: search, $options: 'i' } },
                { 'SUPPLIER.NAME': { $regex: search, $options: 'i' } }, // Tìm theo tên supplier
                { 'SUPPLIER.EMAIL': { $regex: search, $options: 'i' } },
                { 'SUPPLIER.PHONE': { $regex: search, $options: 'i' } },
            ]
        }

        if (userId?.trim()) {
            matchConditions.IMPORTED_BY = userId
        }

        if (Object.keys(matchConditions).length > 0) {
            pipeline.push({ $match: matchConditions })
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
                IMPORT_DATE: "$IMPORTED_DATE",
                IMPORTED_BY: "$ACCOUNT.USERNAME",
                STATUS: "$STATUS",
                TOTAL_AMOUNT: "$TOTAL_AMOUNT",
                TAX: "$TAX",
                TOTAL_WITH_TAX: "$TOTAL_WITH_TAX",
                ITEMS: "$ITEMS",
            }
        })
        pipeline.push({ $sort: {IMPORTED_DATE: -1} })
        pipeline.push({ $skip: skip })
        pipeline.push({ $limit: limitNumber })

        const [totalResult, results] = await Promise.all([
            InvoiceModel.aggregate(totalPipeline),
            InvoiceModel.aggregate(pipeline)
        ])
                        
        // tổng số bản ghi
        const total = totalResult[0] ?. total || null

        return {
            total,
            page: pageNumber,
            limit: limitNumber,
            results: results
        }

         
    } catch (error) {
        throw new Error('Lỗi khi lấy danh sách hóa đơn');
    }
    
}

const createInvoice = async (data) => {
    const {supplierId, importedBy, statusName, totalAmount, tax, items} = data
    const now = new Date()

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
        TAX: tax,
        TOTAL_WITH_TAX: totalAmount + totalAmount * (tax/100),
        ITEMS: items,
    }

    // console.log(invoiceData)

    try {
        const newInvoice = new PurchaseInvoice(invoiceData)
        // console.log(newInvoice)

        const invoice = await newInvoice.save()
        // try {
        //     const invoice = await newInvoice.save()
        // }

        // catch (error) {
        //     console.log(error)
        // }
        console.log("Lưu thành công")

        return await handleInvoiceDataForResponse(invoice)
    } catch (error) {
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