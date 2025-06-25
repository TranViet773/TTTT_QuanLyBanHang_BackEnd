const purchaseInvoiceService = require('../services/purchaseInvoice.service')
const invoiceHelper = require('../helpers/invoice.helper')

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
        const data = invoiceHelper.standardizationData(req.body)

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

const updateInvoice = async (req, res) => {
    try {

        const data = invoiceHelper.standardizationData(req.body)

        data.invoiceCode = req.params.invoiceCode
        data.userId = req.user.USER_ID
        const response = await purchaseInvoiceService.updateInvoice(data)

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

const deleteItems = async (req, res) => {
    try {
        const data = req.params
        data.items = req.body

        const response = await purchaseInvoiceService.deleteItems(data)

        if (response?.error) {
            return res.status(400).json({
                message: response.error,
                success: false,
                data: null
            })
        }

        if (response?.message) {
            return res.status(200).json({
                message: response.message,
                success: true,
                data: null
            })
        }

        return res.status(200).json({
            message: "Cập nhật chi tiết hóa đơn thành công.",
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

const deleteInvoice = async (req, res) => {
    try {
        const response = await purchaseInvoiceService.deleteInvoice(req.params.invoiceCode, null)

        if (response?.error) {
            return res.status(400).json({
                message: response.error,
                success: false,
                data: null
            })
        }

        return res.status(400).json({
            message: "Xóa hóa đơn thành công.",
            success: true,
            data: null
        })
    } catch(error) {
        return res.status(400).json({
            message: error.message,
            success: false,
            data: null
        })
    }
}

const statisticsRevenueLast7Days = async (req, res) => {
    try {
        const response = await purchaseInvoiceService.statisticsRevenueLast7Days()
        return res.status(200).json({
            success: true,
            message: "Thống kê doanh thu trong 7 ngày qua.",
            data: response,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
            data: null
        })
    }
}

const statisticsRevenueLast4Weeks = async (req, res) => {
    try {
        console.log(req?.query?.date);
        const response = await purchaseInvoiceService.statisticsRevenueLast4Weeks(req?.query?.date);
        return res.status(200).json({
            success: true,
            message: "Thống kê doanh thu trong 4 tuần qua.",
            data: response,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
            data: null
        })
    }
}

const statisticsRevenueLast4Months = async (req, res) => {
    try {
        const response = await purchaseInvoiceService.statisticsRevenueLast4Months()
        return res.status(200).json({
            success: true,
            message: "Thống kê doanh thu trong 4 tháng qua.",
            data: response,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
            data: null
        })
    }
}

module.exports = {
    getAllInvoices,
    getInvoiceByCode,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    deleteItems,
    statisticsRevenueLast4Months,
    statisticsRevenueLast4Weeks,
    statisticsRevenueLast7Days
}