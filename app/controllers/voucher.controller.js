const voucherService = require("../services/voucher.service");
const Voucher = require("../models/Vouchers.model");

const createVoucher = async (req, res) => {
    try {
        const data = req.body;
        data.CREATE_BY = req.user.USER_ID; // Lấy ID người dùng từ middleware xác thực
        const existing = await Voucher.findOne({
          VOUCHER_CODE: data.VOUCHER_CODE,
        });
        if (existing) {
            return res.status(400).json({
                //message: "Voucher code đã tồn tại",
                message :`Voucher Code '${data.VOUCHER_CODE}' đã tồn tại`,
                success: false,
                data: null,
            })
        }
        const result = await voucherService.createVoucher(data);
        if (result.error) {
            return res.status(400).json({
                message: result.error,
                success: false,
                data: null,
            });
        }
        res.status(201).json({
            message: "Tạo voucher thành công",
            success: true,
            data: result,
        });
    } catch (error) {

        if (error.code === 11000) {

            return res.status(400).json({
                message: "Voucher code đã tồn tại",
                success: false,
                data: null,
            });
        }
        console.error("Lỗi tạo voucher:", error);
        res.status(500).json({
            message: "Lỗi tạo voucher",
            success: false,
            data: null,
        });
    }
};



const getAllVoucher = async (req, res) => {
    try {
        const result = await voucherService.getAllVouchers(req.query);

        if (result.error) {
            return res.status(400).json({
                message: result.error,
                success: false,
                data: null,
            });
        }

        res.status(200).json({
            message: "Lấy danh sách voucher thành công",
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Lỗi lấy danh sách voucher:", error);
        res.status(500).json({
            message: "Lỗi lấy danh sách voucher",
            success: false,
            data: null,
        });
    }
};


const getVoucherById = async (req, res) => {
    try {
        const result = await voucherService.getVoucherById(req.params.id);

        if (result.error) {
            return res.status(404).json({
                message: result.error,
                success: false,
                data: null,
            });
        }

        res.status(200).json({
            message: "Lấy thông tin voucher thành công",
            success: true,
            data: result.voucher,
        });
    } catch (error) {
        console.error("Lỗi lấy thông tin voucher:", error);
        res.status(500).json({
            message: "Lỗi lấy thông tin voucher",
            success: false,
            data: null,
        });
    }
};


const updateVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findOne({ VOUCHER_CODE: req.params.id });
        if (!voucher) {
            return res.status(404).json({
                message: "Voucher không tồn tại",
                success: false,
                data: null,
            });
        }

        const result = await voucherService.updateVoucher(voucher, req.body);

        if (result.error) {
            return res.status(400).json({
                message: result.error,
                success: false,
                data: null,
            });
        }

        res.status(200).json({
            message: "Cập nhật voucher thành công",
            success: true,
            data: result.voucher,
        });
    } catch (error) {
        console.error("Lỗi cập nhật voucher:", error);
        res.status(500).json({
            message: "Lỗi cập nhật voucher",
            success: false,
            data: null,
        });
    }
};


const deleteVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findOne({ VOUCHER_CODE: req.params.id });
        if (!voucher) {
            return res.status(404).json({
                message: "Voucher không tồn tại",
                success: false,
                data: null,
            });
        }

        const result = await voucherService.deactivateVoucher(voucher);

        if (result.error) {
            return res.status(400).json({
                message: result.error,
                success: false,
                data: null,
            });
        }

        res.status(200).json({
            message: result.message,
            success: true,
            data: result.voucher,
        });
    } catch (error) {
        console.error("Lỗi xóa voucher:", error);
        res.status(500).json({
            message: "Lỗi xóa voucher",
            success: false,
            data: null,
        });
    }
};


const restoreVoucher = async (req, res) => {
    try {
        const voucher = await Voucher.findOne({ VOUCHER_CODE: req.params.id });
        if (!voucher) {
            return res.status(404).json({
                message: "Voucher không tồn tại",
                success: false,
                data: null,
            });
        }

        const result = await voucherService.restoreVoucher(voucher);

        if (result.error) {
            return res.status(400).json({
                message: result.error,
                success: false,
                data: null,
            });
        }

        res.status(200).json({
            message: result.message,
            success: true,
            data: result.voucher,
        });
    } catch (error) {
        console.error("Lỗi khôi phục voucher:", error);
        res.status(500).json({
            message: "Lỗi khôi phục voucher",
            success: false,
            data: null,
        });
    }
};


module.exports = {
    createVoucher,
    getAllVoucher,
    getVoucherById,
    updateVoucher,
    deleteVoucher,
    restoreVoucher,
};
