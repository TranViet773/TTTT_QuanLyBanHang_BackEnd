const voucherService = require("../services/voucher.service");
const Voucher = require("../models/Vouchers.model");
const User = require("../models/User.model");
const { json } = require("express");

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
        message: `Voucher Code '${data.VOUCHER_CODE}' đã tồn tại`,
        success: false,
        data: null,
      });
    }
    const user = await User.findById(data.CREATE_BY);
    const currentName = user?.LIST_NAME?.find((name) => !name.THRU_DATE);
    const createByName = currentName?.FULL_NAME || "Người dùng không xác định";

    const result = await voucherService.createVoucher(data);
    if (result.error) {
      return res.status(400).json({
        message: result.error,
        success: false,
        data: null,
      });
    }

    const resultWithName = {
      ...result.toObject(),
      CREATE_BY: createByName,
    };

    res.status(201).json({
      message: "Tạo voucher thành công",
      success: true,
      data: resultWithName,
      // createByName: createByName,
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

const getTotalVoucher = async (req, res) => {
  try {
    const result = await voucherService.getTotalVoucher();
    if (result.error) {
      return res.status(500).json({
        message: result.error,
        success: false,
        data: null,
      });
    }
    return res.status(200).json({
      message: "Lấy thống kê voucher thành công",
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi trong controller khi lấy voucher", error);
    return res.status(500).json({
      message: "Lỗi khi lấy thống kê Voucher",
      success: false,
      data: null,
    });
  }
};

const addItemsForVoucher = async (req, res) => {
  try {
      const {itemIds} = req.body;
      const {voucherCode} = req.params;
      const result = await voucherService.addItemsForVoucher(voucherCode, itemIds);
      if (result.error) {
        return res.status(500).json({
          message: result.error,
          success: false,
          data: null,
        });
      }
      return res.status(200).json({
        message: "Thêm danh sách sản phẩm được áp dụng vào voucher thành công!",
        success: true,
        data: result,
      });
  } catch (error) {
      console.error("Lỗi khi cập nhật danh sách item cho voucher", error);
      return res.status(500).json({
        message: "Lỗi khi cập nhật danh sách item cho voucher",
        success: false,
        data: null,
      });
    }
};

const removeItemFromVoucher = async (req, res) => {
  try {
      const {itemId} = req.body;
      const {voucherCode} = req.params;
      const result = await voucherService.removeItemFromVoucher(voucherCode, itemId);
      if (result.error) {
        return res.status(500).json({
          message: result.error,
          success: false,
          data: null,
        });
      }
      return res.status(200).json({
        message: "Hủy áp dụng Voucher cho Item thành côngQ!",
        success: true,
        data: result,
      });
  } catch (error) {
      console.error("Lỗi trong quá trình hủy áp dụng Voucher cho Item", error);
      return res.status(500).json({
        message: "Lỗi trong quá trình hủy áp dụng Voucher cho Item",
        success: false,
        data: null,
      });
    }
};

const getItemsFromVoucher = async (req, res) => {
  try{
    const {voucherCode} = req.params;
    console.log(voucherCode);
    const response = await voucherService.getItemsFromVoucher(voucherCode);
    if(response.error){
      return res.status(500).json({
        message: response.error,
        success: false,
        data: null,
      }); 
    }
    
    return res.status(200).json({
      message: "Lấy items từ voucher thành công!",
      success: true,
      data: response
    });
  } catch(e){
    console.log(e);
    return res.status(500).json({
        message: "Lỗi trong quá trình hủy áp dụng Voucher cho Item",
        success: false,
        data: null,
      });
  }
}

module.exports = {
  createVoucher,
  getAllVoucher,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  restoreVoucher,
  getTotalVoucher,
  addItemsForVoucher,
  removeItemFromVoucher,
  getItemsFromVoucher
};
