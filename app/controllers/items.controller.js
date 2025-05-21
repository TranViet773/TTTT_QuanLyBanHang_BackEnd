const itemService = require('../services/item.service');

const getAllItems = async (req, res) => {
    try {
        const items = await itemService.getAllItems();
        res.status(200).json({
            success: true,
            message: "Items retrieved successfully",
            data: items,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving items",
            data: error.message,
        });
    }
};

const getItemByCode = async (req, res) => {
    const { code } = req.params;
    try {
        const item = await itemService.getItemByCode(code);
        
        if (item.error) {
            return res.status(404).json({
                success: false,
                message: "Item not found",
                data: error.message,
            });
        }
        res.status(200).json({
            success: true,
            message: "Item retrieved successfully",
            data: item,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving item",
            data: error.message,
        });
    }
};

const createItem = async (req, res) => {
    const itemData = req.body;
    try {
        const newItem = await itemService.createItem(itemData);
        if(newItem.error) {
            return res.status(400).json({
                success: false,
                message: "Error creating item",
                data: newItem.error,
            });
        }
        res.status(201).json({
            success: true,
            message: "Item created successfully",
            data: newItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating item",
            data: error.message,
        });
    }
};

const getAllByItemTypeId = async (req, res) => {
    const { id } = req.params;
    try {
        const items = await itemService.getAllByItemTypeId(id);
        if (items.error) {
            return res.status(404).json({
                success: false,
                message: "Items not found",
                data: items.error,
            });
        }
        res.status(200).json({
            success: true,
            message: "Items retrieved successfully",
            data: items,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving items",
            data: error.message,
        });
    }
};

const updateItem = async (req, res) => {
    const { id } = req.params;
    const itemData = req.body;
    try {
        const updatedItem = await itemService.updateItem(id, itemData);
        if (updatedItem.error) {
            return res.status(404).json({
                success: false,
                message: "Item not found",
                data: updatedItem.error,
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Item updated successfully",
            data: updatedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating item",
            data: error.message,
        });
    }
};

const deleteItem = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedItem = await itemService.deleteItem(id);
        if (deletedItem.error) {
            return res.status(404).json({
                success: false,
                message: "Item not found",
                data: deletedItem.error,
            });
        }
        res.status(200).json({
            success: true,
            message: "Item deleted successfully",
            data: deletedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting item",
            data: error.message,
        });
    }
};
module.exports = {
    getAllItems,
    getItemByCode,
    createItem,
    getAllByItemTypeId,
    updateItem,
    deleteItem
};  