const itemTypeService = require('../services/itemType.service');

const getAllItemTypes = async (req, res) => {
    try {
        const itemTypes = await itemTypeService.getAllItemTypes();
        if (itemTypes.error) {
            return res.status(500).json({
                message: itemTypes.error,
                success: false,
                data: null,
            });
        }
        return res.status(200).json({
            message: 'Fetched all item types successfully',
            success: true,
            data: itemTypes,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null,
        });
    }
};

const getItemTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        const itemType = await itemTypeService.getItemTypeById(id);
        if (itemType.error) {
            return res.status(500).json({
                message: itemType.error,
                success: false,
                data: null,
            });
        }
        return res.status(200).json({
            message: 'Fetched item type by ID successfully',
            success: true,
            data: itemType,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null,
        });
    }
};

const getItemTypeByName = async (req, res) => {
    try {
        const { name } = req.params;
        const itemType = await itemTypeService.getItemTypeByName(name);
        if (itemType.error) {
            return res.status(500).json({
                message: itemType.error,
                success: false,
                data: null,
            });
        }
        return res.status(200).json({
            message: 'Fetched item type by name successfully',
            success: true,
            data: itemType,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null,
        });
    }
};

const createItemType = async (req, res) => {
    try {
        const { itemTypeName, itemTypeNameEn } = req.body;
        const existingItemType = await itemTypeService.getItemTypeByName(itemTypeName);
        if(existingItemType) {
            return res.status(409).json({
                message: 'Item type already exists',
                success: false,
                data: null,
            });
        }

        const newItemType = await itemTypeService.createItemType(req.body);
        if (newItemType.error) {
            return res.status(500).json({
                message: newItemType.error,
                success: false,
                data: null,
            });
        }

        return res.status(201).json({
            message: 'Created new item type successfully',
            success: true,
            data: newItemType,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null,
        });
    }
};

const updateItemType = async (req, res) => {
    try {
        const { id } = req.params;
        const itemTypeData = req.body;
        const updatedItemType = await itemTypeService.updateItemType(id, itemTypeData);
        if (updatedItemType.error) {
            return res.status(500).json({
                message: updatedItemType.error,
                success: false,
                data: null,
            });
        }
        return res.status(200).json({
            message: 'Updated item type successfully',
            success: true,
            data: updatedItemType,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null,
        });
    }
};

const deleteItemType = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedItemType = await itemTypeService.deleteItemType(id);
        if (deletedItemType.error) {
            return res.status(500).json({
                message: deletedItemType.error,
                success: false,
                data: null,
            });
        }
        return res.status(200).json({
            message: 'Deleted item type successfully',
            success: true,
            data: deletedItemType,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            success: false,
            data: null,
        });
    }
};


module.exports = {
    createItemType,
    getAllItemTypes,
    getItemTypeById,
    getItemTypeByName,
    updateItemType,
    deleteItemType
}