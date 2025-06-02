const purchaseInvoiceService = require('../services/purchaseInvoice.service')

const getAllInvoices = async (req, res) => {
    try {

        const query = {...req.query}

        console.log(query)

        const response = await purchaseInvoiceService.getAllInvoices(query)

        if (response?.error) {
            return res.status(500).json({
                message: response.error,
                success: false,
                data: null
            })
        } 

        return res.status(200).json({
            message: "Danh sách hóa đơn.",
            success: true,
            data: response
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null
        })
    }
}

const getInvoiceByCode = async (req, res) => {
    try {
        const invoiceCode = req.params.invoiceCode
        const user = req.user
        const response = await purchaseInvoiceService.getInvoiceByCode(invoiceCode, user)

        if (response?.error) {
            return res.status(400).json({
                message: response.error,
                success: false,
                data: null
            })
        } 

        return res.status(200).json({
            message: response ? `Truy xuất hóa đơn ${invoiceCode} thành công.` : `Không tìm thấy hóa đơn ${invoiceCode}.`,
            success: true,
            data: response
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null
        })
    }
}


const createInvoice = async (req, res) => {
    try {
        const data = req.body

        data.importedBy = req.user.USER_ID

        const response = await purchaseInvoiceService.createInvoice(data)

        if (response?.error) {
            return res.status(400).json({
                message: response.error,
                success: false,
                data: null
            })
        }

        return res.status(201).json({
            message: "Tạo hóa đơn thành công.",
            success: true,
            data: response
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null
        })
    }
}

const updateInvoiceStatus = async (req, res) => {
    try {

        const data = req.body

        data.invoiceCode = req.params.invoiceCode
        data.userId = req.user.USER_ID
        const response = await purchaseInvoiceService.updateInvoiceStatus(data)

        if (response?.error) {
            return res.status(400).json({
                message: response.error,
                success: false,
                data: null
            })
        }

        return res.status(200).json({
            message: "Cập nhật trạng thái hóa đơn thành công.",
            success: true,
            data: response
        })
        
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null
        })
    }
}

module.exports = {
    getAllInvoices,
    getInvoiceByCode,
    createInvoice,
    updateInvoiceStatus,
}