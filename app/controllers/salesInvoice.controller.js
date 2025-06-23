const salesInvoiceService = require('../services/salesInvoice.service')

const getAllInvoices = async (req, res) => {
    try {

        const query = {...req.query}

        const response = await salesInvoiceService.getAllInvoices(query)

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
        // const user = req.user
        const response = await salesInvoiceService.getInvoiceByCode(invoiceCode)

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

        data.soldBy = req.user.USER_ID

        const response = await salesInvoiceService.createInvoice(data)

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

        const data = req.body
        data.invoiceCode = req.params.invoiceCode
        data.userId = req.user
        
        const response = await salesInvoiceService.updateInvoice(data)

        if (response?.warning) {
            return res.status(400).json({
                message: response.warning,
                success: false,
                data: response.invoice
            })
        }

        if (response?.error) {
            return res.status(400).json({
                message: response.error,
                success: false,
                data: null
            })
        }

        return res.status(200).json({
            message: "Cập nhật hóa đơn thành công.",
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
        data.items = req.body.items

        const response = await salesInvoiceService.deleteItems(data)

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
            message: "Xoá sản phẩm thành công.",
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
        const response = await salesInvoiceService.deleteInvoice(req.params.invoiceCode, null)

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

const statisticInvoiceBasedOnStatus = async (req, res) => {
    try {
        const response = await salesInvoiceService.statisticInvoiceBasedOnStatus()
        return res.status(200).json({
            success: true,
            message: "Thống kê số lượng hóa đơn bán hàng theo trạng thái.",
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

const statisticsRevenueLast7Days = async (req, res) => {
    try {
        const response = await salesInvoiceService.statisticsRevenueLast7Days()
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
        const response = await salesInvoiceService.statisticsRevenueLast4Weeks(req?.query?.date);
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
        const response = await salesInvoiceService.statisticsRevenueLast4Months()
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
    deleteItems,
    deleteInvoice,
    statisticInvoiceBasedOnStatus,
    statisticsRevenueLast7Days,
    statisticsRevenueLast4Weeks,
    statisticsRevenueLast4Months
}