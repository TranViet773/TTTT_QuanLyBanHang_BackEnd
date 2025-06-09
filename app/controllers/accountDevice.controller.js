const accountDeviceService = require('../services/accountDevice.service')

const getAllDevice = async (req, res) => {
    try {
        const response = await accountDeviceService.getAllDevice(req.user)

        return res.status(200).json({
            message: 'Danh sách thiết bị đăng nhập.',
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

const getAllDeviceByUserId = async (req, res) => {
    try {
        const data = req.params
        data.user = req.user
        const response = await accountDeviceService.getDeviceListByUserId(data)

        return res.status(200).json({
            message: 'Danh sách thiết bị đăng nhập.',
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
    getAllDevice,
    getAllDeviceByUserId
}