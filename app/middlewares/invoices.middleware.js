
const checkRoleForCreatingMiddleware = async (req, res, next) => {
    try {
        const data = req.body
        const user = req.user

        req.body.createdBy = user.USER_ID

        if (user.IS_CUSTOMER) {
            if (data.status !== 'DRAFT') {
                return res.status(400).json({
                    message: `Không thể tạo hóa đơn trạng thái ${data.status}.`,
                    success: false,
                    data: null
                })
            }

            if (data.purchaseMethod === 'IN_STORE') {
                return res.status(400).json({
                    message: `Không thể tạo hóa đơn với phương thức mua hàng IN_STORE.`,
                    success: false,
                    data: null
                })
            }

            req.body.customerId = user.USER_ID
        }

        else {
            req.body.soldBy = user.USER_ID
        }
        console.log(req.body)
        next()
    } catch (error) {
        console.log(error)
        throw new Error ('Lỗi xảy ra khi kiểm tra dữ liệu đầu vào.')
    }
}

module.exports = {
    checkRoleForCreatingMiddleware
}