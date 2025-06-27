
const checkRoleForCreatingMiddleware = async (req, res, next) => {
    try {
        const data = req.body
        const user = req.user

        req.body.createdBy = user.USER_ID

        if (user.IS_CUSTOMER) {
            if (data.status !== 'DRAFT') {
                return res.status(403).json({
                    message: `Không thể tạo hóa đơn trạng thái ${data.status}.`,
                    success: false,
                    data: null
                })
            }

            if (data.purchaseMethod === 'IN_STORE') {
                return res.status(403).json({
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

const checkRoleForPurchaseInvoiceMiddleware = async (req, res, next) => {
    try {
        const data = req.body
        const user = req.user

        if (!user.IS_ADMIN && !user.IS_MANAGER && !user.IS_SERVICE_STAFF) {
            return res.status(403).json({
                message: `Không có quyền truy cập.`,
                success: false,
                data: null
            })
        }

        // console.log("data:", data)
        // console.log("user:", user)

        if (data.statusName !== 'DRAFT' && data.statusName !== 'PENDING_APPROVAL') {
            if (!user.IS_ADMIN && !user.IS_MANAGER) {
                return res.status(403).json({
                    message: `Không thể tạo hoặc cập nhật trạng thái ${data.statusName} cho hóa đơn.`,
                    success: false,
                    data: null
                })
            }
        }        

        next()

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null
        })
    }
}

module.exports = {
    checkRoleForCreatingMiddleware,
    checkRoleForPurchaseInvoiceMiddleware
}