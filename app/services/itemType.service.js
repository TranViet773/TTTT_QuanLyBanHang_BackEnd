const ItemTypeModel = require('../models/ItemType.model');

const getAllItemTypes = async () => {
    try {
        const itemTypes = await ItemTypeModel.find();
        return { itemTypes, quantity: itemTypes.length };
    } catch (error) {
        return { error: 'Error fetching item types: ' + error.message };
    }
}
const getItemTypeById = async (id) => {
    try {
        const itemType = await ItemTypeModel.findById(id);
        return itemType;     
    } catch (error) {
        return { error: 'Error fetching item type by ID: ' + error.message };
    }
}
const getItemTypeByName = async (name) => {
    try {
        const itemType = await ItemTypeModel.aggregate([
            {
                $match: {
                    $or: [
                        { ITEM_TYPE_NAME: { $regex: name, $options: 'i' } },
                        { ITEM_TYPE_NAME_EN: { $regex: name, $options: 'i' } }
                    ]
                }
            }
        ]);
        return itemType;     
    } catch (error) {
        return { error: 'Error fetching item type by name: ' + error.message };
    }
}
const createItemType = async (itemTypeData) => {
    try{
        const {itemTypeName, itemTypeNameEn} = itemTypeData;
        const newItemType = await ItemTypeModel.create({
            ITEM_TYPE_NAME: itemTypeName,
            ITEM_TYPE_NAME_EN: itemTypeNameEn
        });
        return newItemType;
    } catch (error) {
        return { error: 'Error creating item type: ' + error.message };
    }
}
const updateItemType = async (id, itemTypeData) => {
    try {
        const {itemTypeName, itemTypeNameEn} = itemTypeData;
        const updatedItemType = await ItemTypeModel.findByIdAndUpdate(id, {
            ITEM_TYPE_NAME: itemTypeName,
            ITEM_TYPE_NAME_EN: itemTypeNameEn
        }, { new: true });
        return updatedItemType;
    } catch (error) {
        return { error: 'Error updating item type: ' + error.message };
    }
}
const deleteItemType = async (id) => {
    try {
        const deletedItemType = await ItemTypeModel.findByIdAndDelete(id);
        return deletedItemType; 
    } catch (error) {
        return { error: 'Error deleting item type: ' + error.message };
    }
}

module.exports = {
    getAllItemTypes,
    getItemTypeById,
    createItemType,
    updateItemType,
    deleteItemType,
    getItemTypeByName
}