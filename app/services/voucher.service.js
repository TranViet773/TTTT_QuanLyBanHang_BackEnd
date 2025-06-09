const Voucher = require("../models/Vouchers.model");

const isVoucherAvailable = (voucher) => {
    // const voucher = await Voucher.findOne({ VOUCHER_CODE: voucherCode, IS_ACTIVE: true });
    if (!voucher) {
        return {
            available: false,
            message: "Voucher không tồn tại hoặc đã hết hạn",
        };
    }
    // kiem tra ngày bắt đầu và kết thúc của voucher
    const currentDate = new Date();
    if (currentDate < voucher.START_DATE) {
        return {
            available: false,
            message: "Voucher chưa bắt đầu sử dụng",
        };
    }
    if (currentDate > voucher.END_DATE) {
        return {
            available: false,
            message: "Voucher đã hết hạn",
        };
    }
    if (voucher.NUMBER_USING >= voucher.QUANTITY) {
        return {
            available: false,
            message: "Voucher đã sử dụng hết",
        };
    }
    return {
        available: true,
        voucher: voucher,
    };
};

const rollbackNumberUsing = async (vouchers) => {
    try {
        for (const voucher of vouchers) {
            if (voucher.NUMBER_USING > 0) {
                voucher.NUMBER_USING--;
                await voucher.save();
            } else {
                return {
                    error: "không thể rollback khi number_using = 0",
                };
            }
        }
    } catch (error) {
        console.error("Lỗi khi rollback số lần sử dụng", error);
        return {
            error: "KHông thể rollback",
        };
    }
};

const updateNumberUsing = async (voucher) => {
    try {
        const check = isVoucherAvailable(voucher);
        if (!check.available) {
            return {
                error: check.message,
            };
        }

        voucher.NUMBER_USING += 1;
        await voucher.save();

        return {
            success: true,
            voucher,
        };
    } catch (error) {
        console.error("Lỗi khi cập nhật số lần sử dụng:", error);
        return {
            error: "lỗi khi cập nhật số lần sử dụng",
        };
    }
};

const createVoucher = async (data) => {
    // const newVoucher = new Voucher(data);
    // return await newVoucher.save();
    const {
        VOUCHER_CODE,
        TYPE,
        VALUE,
        APPLY_SCOPE,
        CREATE_BY,
        MAX_DISCOUNT,
        QUANTITY,
        START_DATE,
        END_DATE,
    } = data;
    const now = new Date();
    if (VALUE <= 0) {
        return {
            error: "Giá trị voucher phải lớn hơn 0",
        };
    }
    if (QUANTITY <= 0) {
        return {
            error: "Số lượng voucher phải lớn hơn 0",
        };
    }
    if (new Date(START_DATE) >= new Date(END_DATE)) {
        return {
            error: "Ngày bắt đầu phải trước ngày kết thúc",
        };
    }

    if (new Date(END_DATE) <= now) {
        return {
            error: "Ngày kết thúc phải sau ngày hiện tại",
        };
    }
    if (MAX_DISCOUNT < 0) {
        return {
            error: "Giá trị giảm giá tối đa không được nhỏ hơn 0",
        };
    }

    const newVoucher = new Voucher({
        VOUCHER_CODE,
        TYPE,
        VALUE,
        APPLY_SCOPE,
        CREATE_BY,
        MAX_DISCOUNT,
        QUANTITY,
        START_DATE,
        END_DATE,
        // NUMBER_USING: 0,//Mặc định số lần sử dụng là 0
        // IS_ACTIVE: true, // Mặc định voucher đang hoạt động
    });
    try {
        return await newVoucher.save();
    } catch (error) {
        console.error("Error creating voucher:", error);
        throw new Error(
            "Voucher code đã tồn tại hoặc có lỗi trong quá trình tạo voucher"
        );
    }
};

const getAllVouchers = async ({
    page = 1,
    limit = 10,
    search = "",
    isActive,
    type,
    minUse,
    maxUse,
    applyScope,
    startDate,
    endDate,
}) => {
    try {
        const pageNumber = Math.max(parseInt(page), 1);
        const limitNumber = Math.max(parseInt(limit), 1);
        const skip = (pageNumber - 1) * limitNumber;

        // khai báo đối tượng truy vấn
        const query = {};

        if (search.trim() !== "") {
            query.$or = [
                {
                    VOUCHER_CODE: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        if (isActive !== undefined) {
            if (isActive === "true") {
                query.IS_ACTIVE = true;
            } else if (isActive === "false") {
                query.IS_ACTIVE = false;
            }
        }

        if (type) {
            query.TYPE = type;
        }
        if (minUse && maxUse && parseInt(minUse) > parseInt(maxUse)) {
            return {
                error: "giá trị minUse phải nhỏ hơn giá trị maxUse",
            };
        }
        if (minUse || maxUse) {
            query.NUMBER_USING = {};
            if (minUse) {
                query.NUMBER_USING.$gte = minUse;
            }
            if (maxUse) {
                query.NUMBER_USING.$lte = maxUse;
            }
        }

        if (applyScope) {
            query.APPLY_SCOPE = applyScope;
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return {
                error: "ngày bắt đầu phải nhỏ hơn ngày kết thúc",
            };
        }

        if (startDate || endDate) {
            query.START_DATE = {};

            if (startDate) {
                query.START_DATE.$gte = new Date(startDate);
            }
            if (endDate) {
                query.START_DATE.$lte = new Date(endDate);
            }
        }

        const total = await Voucher.countDocuments(query);
        const vouchers = await Voucher.find(query)
            .populate("CREATE_BY")
            .skip(skip)
            .limit(limitNumber)
            .sort({ createdAt: -1 })
            .lean();
        // vouchers.forEach((voucher) => {
        //   const user = voucher.CREATE_BY;

        //   if (user && Array.isArray(user.LIST_NAME)) {
        //     const today = new Date();
        //     const currentName = user.LIST_NAME.find(
        //       (n) =>
        //         !n.THRU_DATE && // chưa hết hạn
        //         (!n.FROM_DATE || n.FROM_DATE <= today) // đã bắt đầu
        //     );

        //     voucher.CREATE_BY = currentName?.FULL_NAME || "Không rõ";
        //   } else {
        //     voucher.CREATE_BY = "Không rõ";
        //   }
        // });

        for (let i = 0; i < vouchers.length; i++) {
            const voucher = vouchers[i];
            const user = voucher.CREATE_BY;
            if (user && Array.isArray(user.LIST_NAME)) {
                let currentName = null;

                for (let j = 0; j < user.LIST_NAME.length; j++) {
                    const name = user.LIST_NAME[j];
                    if (name.THRU_DATE === null) {
                        currentName = name;
                        break;
                    }
                }
                if (currentName !== null) {
                    voucher.CREATE_BY = currentName.FULL_NAME;
                } else {
                    voucher.CREATE_BY = "Không xác định";
                }
            } else {
                voucher.CREATE_BY = "không xác định";
            }
        }

        return {
            total,
            page: pageNumber,
            limit: limitNumber,
            vouchers,
        };
    } catch (error) {
        console.error("Error fetching vouchers:", error);
        return { error: "Error fetching vouchers" };
    }
};
const getVoucherById = async (voucherCode) => {
    try {
        const voucher = await Voucher.findOne({ VOUCHER_CODE: voucherCode })
            .populate("CREATE_BY")
            .lean();

        if (!voucher) {
            return {
                error: `không có voucher với mã '${voucherCode}'`,
            };
        }

        let listName = [];
        if (voucher.CREATE_BY && voucher.CREATE_BY.LIST_NAME) {
            listName = voucher.CREATE_BY.LIST_NAME;
        }

        let currentName = null;
        for (let i = 0; i < listName.length; i++) {
            const name = listName[i];
            if (name.THRU_DATE === null) {
                currentName = name;
                break;
            }
        }
        if (currentName !== null) {
            voucher.CREATE_BY = currentName.FULL_NAME;
        } else {
            voucher.CREATE_BY = "không xác định";
        }

        return {
            voucher,
        };
    } catch (error) {
        console.log("Lỗi khi lấy mã voucher", error);
        return {
            error: "Đã xảy ra lỗi khi tìm voucher",
        };
    }
};
//
const updateVoucher = async (voucher, updateData) => {
    try {
        if (!voucher) {
            return { error: "Voucher không tồn tại" };
        }

        // Kiểm tra nếu cập nhật số lượng mà nhỏ hơn số lần đã dùng
        if (
            updateData.QUANTITY !== undefined &&
            updateData.QUANTITY < voucher.NUMBER_USING
        ) {
            return {
                error: `Số lượng mới (${updateData.QUANTITY}) phải lớn hơn hoặc bằng số lần đã sử dụng (${voucher.NUMBER_USING})`,
            };
        }
        if (updateData.START_DATE >= updateData.END_DATE) {
            return {
                error: " Ngày bắt đầu phải trước ngày kết thúc",
            };
        }

        // Cập nhật từng trường nếu có dữ liệu truyền vào
        if (updateData.VALUE !== undefined) voucher.VALUE = updateData.VALUE;
        if (updateData.MAX_DISCOUNT !== undefined)
            voucher.MAX_DISCOUNT = updateData.MAX_DISCOUNT;
        if (updateData.QUANTITY !== undefined)
            voucher.QUANTITY = updateData.QUANTITY;
        if (updateData.START_DATE !== undefined)
            voucher.START_DATE = new Date(updateData.START_DATE);
        if (updateData.END_DATE !== undefined)
            voucher.END_DATE = new Date(updateData.END_DATE);
        if (updateData.IS_ACTIVE !== undefined)
            voucher.IS_ACTIVE = updateData.IS_ACTIVE;
        if (updateData.TYPE !== undefined) voucher.TYPE = updateData.TYPE;
        if (updateData.APPLY_SCOPE !== undefined)
            voucher.APPLY_SCOPE = updateData.APPLY_SCOPE;

        await voucher.save();
        return {
            success: true,
            voucher,
        };
    } catch (error) {
        console.error("Lỗi khi cập nhật voucher:", error);
        return {
            error: "Lỗi khi cập nhật voucher",
        };
    }
};

const deactivateVoucher = async (voucher) => {
    try {
        const updated = await Voucher.findOneAndUpdate(
            { VOUCHER_CODE: voucher.VOUCHER_CODE },
            { IS_ACTIVE: false },
            { new: true }
        );

        if (!updated) {
            return {
                error: `Không tìm thấy voucher với mã '${voucher.VOUCHER_CODE}'`,
            };
        }

        return {
            success: true,
            message: `Đã vô hiệu hóa voucher có mã '${voucher.VOUCHER_CODE}'`,
            voucher: updated,
        };
    } catch (error) {
        console.error("Lỗi khi vô hiệu hóa voucher:", error);
        return {
            error: "Đã xảy ra lỗi khi vô hiệu hóa voucher",
        };
    }
};

const restoreVoucher = async (voucher) => {
    try {
        // Kiểm tra nếu voucher đang hoạt động thì không cần restore
        if (voucher.IS_ACTIVE) {
            return {
                error: "Voucher này đang hoạt động, không cần khôi phục.",
            };
        }

        // Thực hiện cập nhật
        const restored = await Voucher.findOneAndUpdate(
            { VOUCHER_CODE: voucher.VOUCHER_CODE },
            { IS_ACTIVE: true },
            { new: true }
        );

        if (!restored) {
            return {
                error: `Không tìm thấy voucher với mã '${voucher.VOUCHER_CODE}'`,
            };
        }

        return {
            success: true,
            message: `Đã khôi phục voucher có mã '${voucher.VOUCHER_CODE}'`,
            voucher: restored,
        };
    } catch (error) {
        console.error("Lỗi khi khôi phục voucher:", error);
        return {
            error: "Đã xảy ra lỗi khi khôi phục voucher",
        };
    }
};

const getTotalVoucher = async () => {
   try{
    // đếm tổng số voucher
    const totalVoucher = await Voucher.countDocuments();

    // đếm tông số voucher đang hoạt động
    const activeVoucher = await Voucher.countDocuments({IS_ACTIVE:true});
    
    //đém tổng số voucher không hoạt động
    const inactiveVoucher = await Voucher.countDocuments({IS_ACTIVE:false});

    //lấy tất cả voucher  tham số đầu không cần diều kiện,tham số 2 chỉ lấy trường NUMBER_USING và đổi sang object kiểu Json, allVoucher là mảng các đối tượng
    const allVoucher = await Voucher.find({},{NUMBER_USING:1}).lean();

    // tính tổng số lượt sử dụng của all voucher
    let allNumberUsing= 0;
    for (let i=0; i<allVoucher.length; i++){
        const voucher = allVoucher[i];
        const number= voucher.NUMBER_USING ;
        allNumberUsing +=number;

    }

    // dếm theo loại giảm PERCENTAGE và FIXED_AMOUNT
    const countPERCENTAGE = await Voucher.countDocuments({TYPE:"PERCENTAGE"});
    const countFIXED_AMOUNT = await Voucher.countDocuments({TYPE:"FIXED_AMOUNT"});

    // đếm theo loại APPLY_SCOPE là Product và global

    const countProduct  = await Voucher.countDocuments({APPLY_SCOPE: "PRODUCT"});
    const countGlobal  = await Voucher.countDocuments({APPLY_SCOPE: "GLOBAL"});

    // đếm các voucher gần hết hạn trong 7 ngày tới
    const today = new Date ();
    today.setHours(0, 0, 0, 0); // Đặt giờ về 00:00:00 để so sánh ngày
    const sevendayLater = new Date ();
    sevendayLater.setDate(today.getDate()+7);
    sevendayLater.setHours(23, 59, 59, 999); // Đặt giờ về 23:59:59 để bao gồm cả ngày cuối cùng

    const expire = await Voucher.countDocuments({
      END_DATE: { $gte: today, $lte: sevendayLater },
    });
      
    return {
      totalVoucher: totalVoucher,
      activeVoucher: activeVoucher,
      inactiveVoucher: inactiveVoucher,
      allNumberUsing: allNumberUsing,
      type: {
        PERCENTAGE: countPERCENTAGE,
        FIXED_AMOUNT: countFIXED_AMOUNT,
      },
      applyScope: {
        PRODUCT: countProduct,
        GLOBAL: countGlobal,
      },
      exprire: expire,
    };


   }catch (error){
    console.log("Lỗi khi thống kê voucher:", error);

    return {
      error: "Có lỗi xảy ra khi thống kê voucher",
    };

   }
}
module.exports = {
  createVoucher,
  getAllVouchers,
  getVoucherById,
  updateVoucher,
  deactivateVoucher,
  restoreVoucher,
  updateNumberUsing,
  rollbackNumberUsing,
  getTotalVoucher,
};
