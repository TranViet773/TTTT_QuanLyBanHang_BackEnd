const UnitItemService = require('../services/unitItem.service');

const createUnitItem = async (req, res) => {
    const unitItemData = req.body;
    try {
        const newUnitItem = await UnitItemService.handleCreateUnitItem(unitItemData);
        if (newUnitItem.error) {
            return res.status(400).json({
                success: false,
                message: "Error creating unit item",
                data: newUnitItem.error,
            });
        }
        res.status(201).json({
            success: true,
            message: "Unit item created successfully",
            data: newUnitItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating unit item",
            data: error.message,
        });
    }
};

const getAllUnitItem = async (req, res) => {
    try {
        const unitItems = await UnitItemService.handleGetAllUnitItems();
        if (unitItems.error) {
            return res.status(400).json({
                success: false,
                message: "Error retrieving unit items",
                data: unitItems.error,
            });
        }
        res.status(200).json({
            success: true,
            message: "Unit items retrieved successfully",
            data: unitItems,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving unit items",
            data: error.message,
        });
    }
};

const getUnitItemById = async (req, res) => {
    const { id } = req.params;
    try {
        const unitItem = await UnitItemService.handleGetUnitItemById(id);
        if (unitItem.error) {
            return res.status(404).json({
                success: false,
                message: "Unit item not found",
                data: unitItem.error,
            });
        }
        res.status(200).json({
            success: true,
            message: "Unit item retrieved successfully",
            data: unitItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving unit item",
            data: error.message,
        });
    }
};

const updateUnitItem = async (req, res) => { 
    const { id } = req.params;
    const unitItemData = req.body;
    try {
        const updatedUnitItem = await UnitItemService.handleUpdateUnitItem(id, unitItemData);
        if (updatedUnitItem.error) {
            return res.status(400).json({
                success: false,
                message: "Error updating unit item",
                data: updatedUnitItem.error,
            });
        }
        res.status(200).json({
            success: true,
            message: "Unit item updated successfully",
            data: updatedUnitItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating unit item",
            data: error.message,
        });
    }
};

const deleteUnitItem = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedUnitItem = await UnitItemService.handleDeleteUnitItem(id);
        if (deletedUnitItem.error) {
            return res.status(404).json({
                success: false,
                message: "Unit item not found",
                data: deletedUnitItem.error,
            });
        }
        res.status(200).json({
            success: true,
            message: "Unit item deleted successfully",
            data: deletedUnitItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting unit item",
            data: error.message,
        });
    }
};

module.exports = {
    createUnitItem,
    getAllUnitItem,
    getUnitItemById,
    updateUnitItem,
    deleteUnitItem
};
