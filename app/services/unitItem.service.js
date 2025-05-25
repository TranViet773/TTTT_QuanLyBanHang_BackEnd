const UnitItem = require('../models/UnitItem.model');

const handleCreateUnitItem = async (unitItemData) => {
    try {
        const isExistingUnitItem = await UnitItem.findOne({ UNIT_ITEM_NAME: unitItemData.unitItemName });
        if (isExistingUnitItem) {
            return { error: "Unit item already exists" };
        }
        const { unitItemName, unitItemNameEN, unitItemAbb } = unitItemData;
        const newUnitItem = new UnitItem({
            UNIT_ITEM_NAME: unitItemName,
            UNIT_ITEM_NAME_EN: unitItemNameEN,
            UNIT_ITEM_ABB: unitItemAbb
        });
        await newUnitItem.save();
        return newUnitItem;
    } catch (error) {
        return { error: error.message };
    }
};

const handleGetAllUnitItems = async () => {
    try {
        const unitItems = await UnitItem.find();
        return unitItems;
    } catch (error) {
        return { error: error.message };
    }
};

const handleGetUnitItemById = async (id) => {
    try {
        const unitItem = await UnitItem.findById(id);
        if (!unitItem) {
            return { error: "Unit item not found" };
        }
        return unitItem;
    }
    catch (error) {
        return { error: error.message };
    }   
};

const handleUpdateUnitItem = async (id, unitItemData) => {
    try {
        const { unitItemName, unitItemNameEN, unitItemAbb } = unitItemData;
        const updatedUnitItem = await UnitItem.findByIdAndUpdate(id, {
            UNIT_ITEM_NAME: unitItemName,
            UNIT_ITEM_NAME_EN: unitItemNameEN,
            UNIT_ITEM_ABB: unitItemAbb
        }, { new: true });
        if (!updatedUnitItem) {
            return { error: "Unit item not found" };
        }   
        return updatedUnitItem;
    }
    catch (error) {
        return { error: error.message };
    }
};

const handleDeleteUnitItem = async (id) => {
    try {
        const deletedUnitItem = await UnitItem.findByIdAndDelete(id);
        if (!deletedUnitItem) {
            return { error: "Unit item not found" };
        }  
        return deletedUnitItem;
    }
    catch (error) {
        return { error: error.message };
    }
};

module.exports = {
    handleCreateUnitItem,
    handleGetAllUnitItems,
    handleGetUnitItemById,
    handleUpdateUnitItem,
    handleDeleteUnitItem
};


