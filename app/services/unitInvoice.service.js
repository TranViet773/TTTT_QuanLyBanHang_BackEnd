const UnitInvoice = require("../models/UnitInvoice.model")



const getAllUnitInvoice = async () => {
    return await UnitInvoice.find()
}

const createUnitInvoice = async (data) => {
    const { unitName, unitNameEn, unitABB } = data

    const unitInvoiceData = {
        UNIT_NAME: unitName,
        UNIT_NAME_EN: unitNameEn,
        UNIT_ABB: unitABB
    }

    const newUnitInvoice = new UnitInvoice(unitInvoiceData)

    try {
        const unitInvoice = await newUnitInvoice.save()
        console.log(unitInvoice)
        return unitInvoice
    } catch(error) {
        console.log(error.message)
        throw new Error("Lỗi xảy ra khi tạo đơn vị tiền tệ mới.")
    }
}

const updateUnitInvoice = async (data) => {
    const {unitInvoiceId, unitName, unitNameEn, unitABB} = data

    try {
        const unitInvoice = await UnitInvoice.findByIdAndUpdate(unitInvoiceId, {
            UNIT_NAME: unitName,
            UNIT_NAME_EN: unitNameEn,
            UNIT_ABB: unitABB
        }, {new: true})
        
        return unitInvoice
    } catch (error) {
        console.log(error.message)
        throw new Error("Lỗi xảy ra khi cập nhật đơn vị tiền tệ.")
    }
}
 
const deleteUnitInvoice = async (id) => {
    try {
        return await UnitInvoice.deleteOne({ _id: id })
    } catch (error) {
        console.log(error.message)
        throw new Error("Lỗi khi xóa đơn vị tiền tệ.")
    }
}

module.exports = {
    createUnitInvoice,
    getAllUnitInvoice,
    updateUnitInvoice,
    deleteUnitInvoice,
}