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
        return {error: 'Lỗi khi lấy danh sách nhà cung cấp'};
    }
};

// CREATE
// const createSupplier = async (data) => {
//     const newSupplier = new Supplier(data);
//     return await newSupplier.save();
// };
const createSupplier = async (data) => {
  const {
    SUPPLIER_NAME,
    SUPPLIER_PHONE,
    SUPPLIER_EMAIL,
    SUPPLIER_ADDRESS,
    SUPPLIER_TAX_CODE,
    SUPPLIER_CONTACT_PERSON_NAME,
    NOTE,
  } = data;

  if (!SUPPLIER_NAME?.trim()) {
    return { error: "Tên nhà cung cấp là bắt buộc." };
  }
  if (!SUPPLIER_PHONE?.trim()) {
    return { error: "Số điện thoại là bắt buộc." };
  }
  if (!SUPPLIER_EMAIL?.trim()) {
    return { error: "Email là bắt buộc." };
  }

  const name = SUPPLIER_NAME.trim();
  const phone = SUPPLIER_PHONE.trim();
  const email = SUPPLIER_EMAIL.trim().toLowerCase();

  const existing = await Supplier.findOne({
    $or: [
      { SUPPLIER_NAME: name },
      { SUPPLIER_PHONE: phone },
      { SUPPLIER_EMAIL: email },
    ],
    IS_ACTIVE: true,
  });

  if (existing) {
    return {
      error:
        "Nhà cung cấp đã tồn tại (tên, email hoặc số điện thoại bị trùng).",
    };
  }

  // 4. Tạo mới
  const newSupplier = new Supplier({
    SUPPLIER_NAME: name,
    SUPPLIER_PHONE: phone,
    SUPPLIER_EMAIL: email,
    SUPPLIER_ADDRESS: SUPPLIER_ADDRESS?.trim() || "",
    SUPPLIER_TAX_CODE: SUPPLIER_TAX_CODE?.trim() || "",
    SUPPLIER_CONTACT_PERSON_NAME: SUPPLIER_CONTACT_PERSON_NAME?.trim() || "",
    NOTE: NOTE?.trim() || "",
    IS_ACTIVE: true,
  });

  try {
    return await newSupplier.save();
  } catch (err) {
    console.error("Lỗi khi tạo nhà cung cấp:", err);
    return { error: "Lỗi khi lưu nhà cung cấp." };
  }
};
  
// READ BY ID
const getSupplierById = async (id) => { 
    return await Supplier.findById(id);
};

// UPDATE
// const updateSupplier = async (id, data) => {
//     return await Supplier.findByIdAndUpdate(id, data, { new: true });
// };
const updateSupplier = async (id, data) => {
  try {
    // 1. Kiểm tra ID hợp lệ
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return { error: "ID không hợp lệ." };
    }

    // 2. Kiểm tra nhà cung cấp có tồn tại và đang hoạt động không
    const supplier = await Supplier.findOne({ _id: id, IS_ACTIVE: true });
    if (!supplier) {
      return { error: "Không tìm thấy nhà cung cấp hoặc đã bị vô hiệu hóa." };
    }

    // 3. Chuẩn hóa các trường nếu có
    const name = data.SUPPLIER_NAME?.trim();
    const phone = data.SUPPLIER_PHONE?.trim();
    const email = data.SUPPLIER_EMAIL?.trim().toLowerCase();

    // 4. Kiểm tra trùng lặp (với bản ghi khác)
    const conflict = await Supplier.findOne({
      _id: { $ne: id },
      IS_ACTIVE: true,
      $or: [
        name ? { SUPPLIER_NAME: name } : null,
        phone ? { SUPPLIER_PHONE: phone } : null,
        email ? { SUPPLIER_EMAIL: email } : null,
      ].filter(Boolean), // loại bỏ null nếu không truyền
    });

    if (conflict) {
      return {
        error: "Tên, email hoặc số điện thoại đã tồn tại ở nhà cung cấp khác.",
      };
    }

    // 5. Cập nhật dữ liệu
    const updated = await Supplier.findByIdAndUpdate(
      id,
      {
        ...data,
        SUPPLIER_NAME: name,
        SUPPLIER_PHONE: phone,
        SUPPLIER_EMAIL: email,
      },
      { new: true }
    );

    return updated;
  } catch (error) {
    console.error("Lỗi khi cập nhật nhà cung cấp:", error);
    return { error: "Đã xảy ra lỗi khi cập nhật." };
  }
};
  

// DELETE ( đổi trạng thái)
// const deleteSupplier = async (id) => {
//     return await Supplier.findByIdAndUpdate(id, { IS_ACTIVE: false }, { new: true });
// };
const deleteSupplier = async (id) => {
  try {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return { error: "ID không hợp lệ." };
    }

    const supplier = await Supplier.findOne({ _id: id, IS_ACTIVE: true });
    if (!supplier) {
      return { error: "Nhà cung cấp không tồn tại hoặc đã bị vô hiệu hóa." };
    }


    const updated = await Supplier.findByIdAndUpdate(
      id,
      { IS_ACTIVE: false },
      { new: true }
    );
    return updated;
  } catch (error) {
    console.error("Lỗi khi xoá nhà cung cấp:", error);
    return { error: "Đã xảy ra lỗi khi xoá nhà cung cấp." };
  }
};
  

module.exports = {
    getAllSuppliers,
    createSupplier,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};