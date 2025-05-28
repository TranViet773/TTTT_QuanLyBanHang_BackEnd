const unitInvoiceService = require('../services/unitInvoice.service')

const createUnitInvoice = async (req, res) => {
    try {
        const response = await unitInvoiceService.createUnitInvoice(req.body)

        return res.status(201).json({
            message: "Tạo đơn vị tiền tệ thành công",
            success: true,
            data: response
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null,
        })
    }
}

const getAllUnitInvoice = async (req, res) => {
    try {
        const response = await unitInvoiceService.getAllUnitInvoice()

        return res.status(200).json({
            message: "Danh sách đơn vị tiền tệ.",
            success: true,
            data: response
        })
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi xảy ra khi truy xuất dữ liệu",
            success: false,
            data: null,
        })
    }
}

const updateUnitInvoice = async (req, res) => {
    try {
        const data = req.body
        data.unitInvoiceId = req.params.id
        const response = await unitInvoiceService.updateUnitInvoice(data)

        return res.status(200).json({
            message: "Cập nhật đơn vị tiền tệ thành công.",
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

const deleteUnitInvoice = async(req, res) => {
    try {
        const response = await unitInvoiceService.deleteUnitInvoice(req.params.id)
        return res.status(200).json({
            message: "Xóa đơn vị tiền tệ thành công",
            success: true,
            data: null
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null
        })
    }
};

const getUnitInvoiceById = async (req, res) => {
    try {
        const response = await unitInvoiceService.getUnitInvoiceById(req.params.id)

        if(!response) {
            return res.status(404).json({
                message: "Không tìm thấy đơn vị tiền tệ.",
                success: false,
                data: null
            })
        }

        return res.status(200).json({
            message: "Thông tin đơn vị tiền tệ.",
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
    createUnitInvoice,
    getAllUnitInvoice,
    updateUnitInvoice,
    deleteUnitInvoice,
    getUnitInvoiceById
}