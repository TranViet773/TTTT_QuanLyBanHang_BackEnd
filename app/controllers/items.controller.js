const itemService = require('../services/item.service');

const getAllItems = async (req, res) => {
    try {
        console.log('Query:', req.query);
        const items = await itemService.getAllItems(req.query);
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

const updateItemStock = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    try {
        console.log("quantity:", quantity);
        const updatedItem = await itemService.updateItemStock(id, quantity);
        if (updatedItem.error) {
            return res.status(404).json({
                success: false,
                message: updatedItem.error,
                data: updatedItem.error,
            });
        }
        res.status(200).json({
            success: true,
            message: "Item stock updated successfully",
            data: updatedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating item stock",
            data: error.message,
        });
    }
};

const updateItemPrice = async (req, res) => {
    const { id } = req.params;
    const { price } = req.body;
    try {
        const updatedItem = await itemService.updateItemPrice(id, price);
        if (updatedItem.error) {
            return res.status(404).json({
                success: false,
                message: updatedItem.error,
                data: updatedItem.error,
            });
        }
        res.status(200).json({
            success: true,
            message: "Item price updated successfully",
            data: updatedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating item price",
            data: error.message,
        });
    }
};

const addBOMMaterialToItem = async (req, res) => {
    const { id } = req.params;//itemId
    const { itemCode, quantity, unitId } = req.body;
    const bomMaterials = {
        itemCode: itemCode,
        quantity: quantity,
        unitId: unitId,
    };
    try {
        const updatedItem = await itemService.addBOMMaterialToItem(id, bomMaterials);
        if (updatedItem.error) {
            return res.status(404).json({
                success: false,
                message: updatedItem.error,
                data: updatedItem.error,
            });
        }
        res.status(200).json({
            success: true,
            message: "BOM materials added successfully",
            data: updatedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error adding BOM materials",
            data: error.message,
        });
    }
};

const updateBOMMaterialInItem = async (req, res) => {
    const { id } = req.params;
    const { itemCode, quantity } = req.body;
    const bomMaterial = {
        itemCode: itemCode,
        quantity: quantity,
    };
    try {
        const updatedItem = await itemService.updateBOMMaterialInItem(id, bomMaterial);
        if (updatedItem.error) {
            return res.status(404).json({
                success: false,
                message: updatedItem.error,
                data: updatedItem.error,
            });
        }
        res.status(200).json({
            success: true,
            message: "BOM material updated successfully",
            data: updatedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating BOM material",
            data: error.message,
        });
    }
};

const deleteBOMMaterialInItem = async (req, res) => {
    const { id } = req.params;
    const { itemCode } = req.body;
    try {
        const updatedItem = await itemService.removeBOMMaterialFromItem(id, itemCode);
        if (updatedItem.error) {
            return res.status(404).json({
                success: false,
                message: updatedItem.error,
                data: updatedItem.error,
            });
        }
        res.status(200).json({
            success: true,
            message: "BOM material deleted successfully",
            data: updatedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting BOM material",
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
    deleteItem,
    updateItemStock,
    updateItemPrice,
    addBOMMaterialToItem,
    updateBOMMaterialInItem,
    deleteBOMMaterialInItem
};  