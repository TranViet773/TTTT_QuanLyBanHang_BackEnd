const Item = require("../models/item.model.js");
const ItemTypeModel = require("../models/ItemType.model.js");
const getAllItems = async () => {
  try {
    const items = await Item.find();
    return { items: items, length: items.length };
  } catch (error) {
    return {error: error.message};
  }
};

const getItemByCode = async (code) => {
    try{
        const item = await Item.findOne({ ITEM_CODE: code });
        if (!item) {
            return { error: "Item not found" };
        }
        return item;
    }catch (error) {
        return { error: error.message };
    }
};

const getItemById = async (id) => {
    try {
        const item = await Item.findById({_id: id});
        if (!item) {
            return { error: "Item not found!" };
        }
        return item;
    }
    catch (error) {
        return { error: error.message };
    }
};

const generateItemCode = async (itemType) => {
    try {
        const prefix = itemType.includes('Material') ? "NL" : "SP";
        const code = Math.floor(Math.random() * 1000000);
        return `${prefix}${code}`;
    } catch (error) {
        return { error: error.message };
    }
}

const createItem = async (itemData) => {
    const {
        itemName,
        itemType,
        itemNameEn,
        unit,
        price,
        description,
        isActive = true,
        userId,
        stock,
        bomMaterials
    } = itemData;

    const existingItemType = await ItemTypeModel.findOne({ _id: itemType });
    if (!existingItemType) {
        return { error: "Item type not found" };
    }
    const itemCode = await generateItemCode(existingItemType.ITEM_TYPE_NAME_EN);

    const existingItem = await Item.findOne({ ITEM_NAME: itemName });
    if (existingItem) {
        return { error: "Item already exists" };
    }

    const newItemData = {
        ITEM_CODE: itemCode,
        ITEM_NAME: itemName,
        ITEM_NAME_EN: itemNameEn,
        ITEM_TYPE: existingItemType._id,
        UNIT: unit,
        PRICE: [
            {
                priceAmount: Number(price),
                fromDate: new Date(),
                thruDate: null,
            }
        ],
        UPDATED_AT: new Date(),
        CREATED_AT: new Date(),
        DESCRIPTION: description,
        IS_ACTIVE: isActive,
        IMPORTED_BY: userId, //userId
        ITEM_STOCKS: {
            quantity: stock || 0,
            last_update: new Date(),
        },
        BOM_MATERIALS: bomMaterials || []
    };

    try {
        const newItem = await Item.create(newItemData);
        if (!newItem) {
            return {error: "Failed to create item"};
        }
        return newItem;
    } catch (error) {
        console.error("Lỗi khi tạo item:", error);
        return {error: "Error creating item"};
    }
};

const updateItem = async (id, itemData) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate(id, itemData, { new: true });
        if (!updatedItem) {
            return {error: "Item not found"};
        }
        return updatedItem;
    } catch (error) {
        return {error: "Error updating item"};
    }
};

const deleteItem = async (id) => {
    try {
        const deletedItem = await Item.findByIdAndDelete(id);
        if (!deletedItem) {
            return {error: "Item not found"};
        }
        return deletedItem;
    } catch (error) {
        return {error: "Error deleting item"};
    }
}

const getAllByItemTypeId = async (itemTypeId) => {
    try {
        const items = await Item.find({ ITEM_TYPE: itemTypeId });
        if (!items) {
            return { error: "Items not found" };
        }
        return items;
    } catch (error) {   
        return { error: "Error retrieving items" };
    }
}

module.exports = {
    getAllItems,
    getItemByCode,
    getItemById,
    createItem,
    updateItem,
    getAllByItemTypeId,
    deleteItem
};