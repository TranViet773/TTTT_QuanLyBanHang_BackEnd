const Supplier = require('../models/Supplier.model');

const getAllSuppliers = async ({ page = 1, limit = 10, search = '' }) => {
    try {
        // ép kiểu String thành số
        const pageNumber = Math.max(parseInt(page), 1);
        const limitNumber = Math.max(parseInt(limit), 1);
        // tính toán số lượng bản ghi cần bỏ qua
        const skip = (pageNumber - 1) * limitNumber;

        const query = {
            IS_ACTIVE: true, // chỉ lấy những nhà cung cấp đang hoạt động
        };


        if (search.trim() !== '') {
            query.$or = [
                { SUPPLIER_NAME: { $regex: search, $options: 'i' } }, // Tìm kiếm theo tên nhà cung cấp
                { SUPPLIER_PHONE: { $regex: search, $options: 'i' } }, // Tìm kiếm theo số điện thoại
                { SUPPLIER_EMAIL: { $regex: search, $options: 'i' } }, // Tìm kiếm theo email
            ];
        }

        // tổng số bản ghi
        const total = await Supplier.countDocuments(query);
        // lấy danh sách nhà cung cấp
        const supplier = await Supplier.find(query)
            .skip(skip)
            .limit(limitNumber)
            .sort({ SUPPLIER_NAME: 1 });
        return {
            total,
            page: pageNumber,
            limit: limitNumber,
            suppliers: supplier,
        }

    } catch (error) {
        console.error('Lỗi khi lấy danh sách nhà cung cấp:', error);
        throw new Error('Lỗi khi lấy danh sách nhà cung cấp');
    }
};

// CREATE
const createSupplier = async (data) => {
    const newSupplier = new Supplier(data);
    return await newSupplier.save();
};
// READ BY ID
const getSupplierById = async (id) => {
    return await Supplier.findById(id);
};

// UPDATE
const updateSupplier = async (id, data) => {
    return await Supplier.findByIdAndUpdate(id, data, { new: true });
};

// DELETE ( đổi trạng thái)
const deleteSupplier = async (id) => {
    return await Supplier.findByIdAndUpdate(id, { IS_ACTIVE: false }, { new: true });
};


module.exports = {
    getAllSuppliers,
    createSupplier,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};