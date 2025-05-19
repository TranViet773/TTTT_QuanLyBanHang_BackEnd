const supplierService = require('../services/supplier.service');

const create = async (req, res) => {
    try {
        const result = await supplierService.createSupplier(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const getAll = async (req, res) => {
    try {
        const result = await supplierService.getAllSuppliers(req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const getById = async (req, res) => {
    try {
        const result = await supplierService.getSupplierById(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const update = async (req, res) => {
    try {
        const result = await supplierService.updateSupplier(req.params.id, req.body);
        if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const remove = async (req, res) => {
    try {
        const result = await supplierService.deleteSupplier(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = {
    create,
    getAll,
    getById,
    update,
    remove
};